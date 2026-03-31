#!/usr/bin/env python3
"""
Character Consistency Generator
================================
Two-phase generation for portrait expression variants and sprite walk cycles.

Phase 1 (Base):  txt2img → one canonical reference image per character.
                 The identity prompt is locked to the same description + seed
                 so it can be regenerated identically at any time.

Phase 2 (Variants): img2img anchored to the base image.
                 The prompt is: identity + expression/pose override.
                 Low denoise strength (0.50 portraits / 0.65 sprites) keeps
                 face/body consistent while allowing expression/pose to shift.

Data-driven: character definitions live in characters.yaml, not in code.

Usage:
  # Generate all characters (both portraits + sprites)
  python generate_characters.py

  # Single character
  python generate_characters.py --character guybrush

  # Portraits only
  python generate_characters.py --character guybrush --mode portraits

  # Sprites only
  python generate_characters.py --character lechuck --mode sprites

  # Regenerate base (forces fresh Phase 1 even if base exists)
  python generate_characters.py --character guybrush --regenerate-base

  # Dry run — print prompts, skip generation
  python generate_characters.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import yaml

# ── Paths ───────────────────────────────────────────────────────
PIPELINE_DIR = Path(__file__).parent
CHARACTERS_FILE = PIPELINE_DIR / "characters.yaml"
PROMPTS_FILE = PIPELINE_DIR / "prompts.yaml"
PALETTE_FILE = PIPELINE_DIR / "palette.pal"

# Output to public/assets (same layout as generate.py)
PUBLIC_ASSETS = PIPELINE_DIR / "../../public/assets"
PORTRAITS_DIR = PUBLIC_ASSETS / "portraits"
SPRITES_DIR = PUBLIC_ASSETS / "sprites"
BASE_DIR = PIPELINE_DIR / "bases"  # Canonical base images (Phase 1 output)

# ── Generation settings ─────────────────────────────────────────
PORTRAIT_CONFIG = {
    "gen_width":  128,
    "gen_height": 128,
    "target_size": (64, 64),
    "num_inference_steps": 30,
    "guidance_scale": 3.5,
    "palette_colors": 16,
    "transparent": False,
    "style_suffix": (
        "pixel art character portrait, close-up face and shoulders, "
        "dialogue box portrait style, lucasarts adventure game, "
        "expressive pixel face, bust shot, dark background"
    ),
}

SPRITE_CONFIG = {
    "gen_width":  128,
    "gen_height": 192,
    "target_size": (32, 48),
    "num_inference_steps": 28,
    "guidance_scale": 3.5,
    "palette_colors": 16,
    "transparent": True,
    "style_suffix": (
        "pixel art character sprite, full body, side view, "
        "lucasarts adventure game style, transparent background, "
        "clean pixel edges, single character centered"
    ),
}

# img2img strength per variant type
PORTRAIT_VARIANT_STRENGTH = 0.50   # Face identity preserved, expression shifts
SPRITE_VARIANT_STRENGTH   = 0.65   # Body proportions preserved, pose shifts
BASE_STRENGTH             = 0.0    # Not used (base is txt2img)

# Shared pixel-art style prefix
PIXEL_ART_BASE = (
    "pixel art, 16-bit era, lucasarts point-and-click adventure game style, "
    "EGA palette, crisp pixels, no anti-aliasing, retro game aesthetic, "
    "monkey island inspired"
)


# ── Pipeline loader ─────────────────────────────────────────────

_pipeline_cache: dict[str, Any] = {}

def load_pipeline(img2img: bool = False) -> Any:
    import torch
    from diffusers import FluxImg2ImgPipeline, FluxPipeline, FluxTransformer2DModel
    from transformers import BitsAndBytesConfig, T5EncoderModel

    # img2img reuses the same model weights as txt2img — never load twice
    if "txt2img" not in _pipeline_cache:
        MODEL_ID = "black-forest-labs/FLUX.1-dev"
        LORA_ID  = "nerijs/pixel-art-xl"
        dtype    = torch.bfloat16

        print("[pipeline] Loading base pipeline (NF4 quantized)...")

        nf4_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=dtype,
        )

        print("[pipeline] Loading transformer (NF4) → GPU...")
        transformer = FluxTransformer2DModel.from_pretrained(
            MODEL_ID,
            subfolder="transformer",
            quantization_config=nf4_config,
            torch_dtype=dtype,
            device_map="cuda:0",
            local_files_only=True,
        )

        print("[pipeline] Loading T5 encoder (NF4) → GPU...")
        text_encoder_2 = T5EncoderModel.from_pretrained(
            MODEL_ID,
            subfolder="text_encoder_2",
            quantization_config=nf4_config,
            torch_dtype=dtype,
            device_map="cuda:0",
            local_files_only=True,
        )

        pipe = FluxPipeline.from_pretrained(
            MODEL_ID,
            transformer=transformer,
            text_encoder_2=text_encoder_2,
            torch_dtype=dtype,
            low_cpu_mem_usage=True,
            local_files_only=True,
        )
        pipe.text_encoder.to("cuda")
        pipe.vae.to("cuda")

        try:
            pipe.load_lora_weights(LORA_ID)
            pipe.fuse_lora(lora_scale=0.85)
            print("[pipeline] LoRA applied")
        except Exception as e:
            print(f"[pipeline] LoRA skipped: {e}")

        pipe.enable_attention_slicing()
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()
        print("[pipeline] Running on CUDA (NF4: ~9GB total VRAM)")
        _pipeline_cache["txt2img"] = pipe

    txt2img_pipe = _pipeline_cache["txt2img"]

    if img2img:
        if "img2img" not in _pipeline_cache:
            # Reuse all components — no extra VRAM
            _pipeline_cache["img2img"] = FluxImg2ImgPipeline(**txt2img_pipe.components)
        return _pipeline_cache["img2img"]

    return txt2img_pipe


# ── Prompt builders ─────────────────────────────────────────────

def build_base_prompt(identity: str, variant_type: str) -> str:
    """Phase 1: canonical reference image prompt."""
    config = PORTRAIT_CONFIG if variant_type == "portrait" else SPRITE_CONFIG
    return f"{identity}, {PIXEL_ART_BASE}, {config['style_suffix']}"


def build_variant_prompt(identity: str, override: str, variant_type: str) -> str:
    """Phase 2: variant prompt = identity + expression/pose override."""
    config = PORTRAIT_CONFIG if variant_type == "portrait" else SPRITE_CONFIG
    return f"{identity}, {override}, {PIXEL_ART_BASE}, {config['style_suffix']}"


# ── Generation functions ────────────────────────────────────────

def generate_base(
    char_id: str,
    identity: str,
    seed: int,
    variant_type: str,
    dry_run: bool = False,
    force: bool = False,
) -> Path:
    """Phase 1: generate the canonical base image (txt2img)."""
    base_path = BASE_DIR / variant_type / f"{char_id}_base.png"
    if base_path.exists() and not force:
        print(f"  [base] Using existing: {base_path}")
        return base_path

    BASE_DIR.mkdir(parents=True, exist_ok=True)
    (BASE_DIR / variant_type).mkdir(parents=True, exist_ok=True)

    config   = PORTRAIT_CONFIG if variant_type == "portrait" else SPRITE_CONFIG
    prompt   = build_base_prompt(identity, variant_type)
    print(f"\n  [base] Generating {char_id} base ({variant_type})")
    print(f"         seed={seed}")
    print(f"         prompt: {prompt[:100]}...")

    if dry_run:
        print("         [DRY RUN]")
        return base_path

    import torch
    pipe = load_pipeline(img2img=False)
    gen  = torch.Generator("cuda" if torch.cuda.is_available() else "cpu").manual_seed(seed)

    t0 = time.time()
    image = pipe(
        prompt=prompt,
        width=config["gen_width"],
        height=config["gen_height"],
        num_inference_steps=config["num_inference_steps"],
        guidance_scale=config["guidance_scale"],
        generator=gen,
    ).images[0]

    image.save(str(base_path))
    print(f"         saved → {base_path}  ({time.time()-t0:.1f}s)")
    _save_meta(base_path, char_id, "base", seed, prompt, config, img2img=None)
    return base_path


def generate_variant(
    output_name: str,
    char_id: str,
    identity: str,
    override: str,
    seed: int,
    variant_type: str,
    base_path: Path,
    strength: float,
    dry_run: bool = False,
) -> Path:
    """Phase 2: generate one expression/pose variant via img2img from base."""
    config = PORTRAIT_CONFIG if variant_type == "portrait" else SPRITE_CONFIG

    if variant_type == "portrait":
        out_dir = PORTRAITS_DIR
    else:
        out_dir = SPRITES_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{output_name}.png"

    prompt = build_variant_prompt(identity, override, variant_type)
    print(f"\n    [variant] {output_name}")
    print(f"              seed={seed}  strength={strength}")
    print(f"              override: {override[:80]}...")

    if dry_run:
        print("              [DRY RUN]")
        return out_path

    import torch
    from PIL import Image

    pipe = load_pipeline(img2img=True)
    gen  = torch.Generator("cuda" if torch.cuda.is_available() else "cpu").manual_seed(seed)

    ref_img = Image.open(str(base_path)).convert("RGB")
    ref_img = ref_img.resize((config["gen_width"], config["gen_height"]))

    t0 = time.time()
    image = pipe(
        prompt=prompt,
        image=ref_img,
        strength=strength,
        num_inference_steps=config["num_inference_steps"],
        guidance_scale=config["guidance_scale"],
        generator=gen,
    ).images[0]

    # Post-process (palette reduction + upscale)
    raw_dir = out_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{output_name}.png"
    image.save(str(raw_path))
    print(f"              raw saved → {raw_path}  ({time.time()-t0:.1f}s)")

    try:
        sys.path.insert(0, str(PIPELINE_DIR))
        from process import process_asset
        processed = process_asset(
            input_path=str(raw_path),
            target_size=config["target_size"],
            palette_colors=config["palette_colors"],
            transparent=config["transparent"],
            upscale=2,
            palette_file=str(PALETTE_FILE) if PALETTE_FILE.exists() else None,
            output_path=str(out_path),
        )
        print(f"              processed → {processed}")
        _save_meta(out_path, output_name, "variant", seed, prompt, config,
                   img2img=str(base_path), strength=strength)
        return Path(processed)
    except Exception as e:
        print(f"              [warn] post-processing failed: {e} — saving raw")
        image.save(str(out_path))
        return out_path


def _save_meta(path: Path, name: str, phase: str, seed: int, prompt: str,
               config: dict, img2img: Any = None, strength: float = 0.0) -> None:
    meta = {
        "name": name, "phase": phase, "seed": seed,
        "prompt": prompt, "img2img": img2img, "strength": strength,
        "gen_size": [config["gen_width"], config["gen_height"]],
    }
    path.with_suffix(".json").write_text(json.dumps(meta, indent=2))


# ── Main pipeline ───────────────────────────────────────────────

def process_character(
    char_id: str,
    char_data: dict,
    mode: str = "all",
    dry_run: bool = False,
    regenerate_base: bool = False,
    portrait_strength: float = PORTRAIT_VARIANT_STRENGTH,
    sprite_strength: float = SPRITE_VARIANT_STRENGTH,
) -> None:
    identity = char_data["identity"].strip().replace("\n", " ")
    base_seed = char_data["base_seed"]

    print(f"\n{'='*60}")
    print(f"  Character: {char_id}")
    print(f"  Identity:  {identity[:80]}...")

    # ── Portraits ──
    if mode in ("all", "portraits") and "portraits" in char_data:
        print(f"\n  [portraits] Phase 1 — generate base")
        base_path = generate_base(
            char_id=char_id,
            identity=identity,
            seed=base_seed,
            variant_type="portrait",
            dry_run=dry_run,
            force=regenerate_base,
        )

        print(f"\n  [portraits] Phase 2 — generate {len(char_data['portraits'])} variants")
        for variant_id, variant in char_data["portraits"].items():
            generate_variant(
                output_name=variant["output"],
                char_id=char_id,
                identity=identity,
                override=variant["expression"],
                seed=variant["seed"],
                variant_type="portrait",
                base_path=base_path,
                strength=portrait_strength,
                dry_run=dry_run,
            )

    # ── Sprites ──
    if mode in ("all", "sprites") and "sprites" in char_data:
        print(f"\n  [sprites] Phase 1 — generate base")

        # Use idle pose as the sprite base
        idle_data = char_data["sprites"].get("idle")
        sprite_base_seed = idle_data["seed"] if idle_data else base_seed + 1000

        base_path = generate_base(
            char_id=char_id,
            identity=identity,
            seed=sprite_base_seed,
            variant_type="sprite",
            dry_run=dry_run,
            force=regenerate_base,
        )

        print(f"\n  [sprites] Phase 2 — generate {len(char_data['sprites'])} frames")
        for frame_id, frame in char_data["sprites"].items():
            generate_variant(
                output_name=frame["output"],
                char_id=char_id,
                identity=identity,
                override=frame["pose"],
                seed=frame["seed"],
                variant_type="sprite",
                base_path=base_path,
                strength=sprite_strength,
                dry_run=dry_run,
            )


# ── CLI ─────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Two-phase character generation: base → consistent variants",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_characters.py                              # All characters
  python generate_characters.py --character guybrush         # One character
  python generate_characters.py --character guybrush --mode portraits
  python generate_characters.py --character guybrush --mode sprites
  python generate_characters.py --regenerate-base            # Force redo Phase 1
  python generate_characters.py --dry-run                    # Print prompts only
        """,
    )
    parser.add_argument(
        "--character", "-c",
        help="Character ID (default: all). e.g. guybrush, lechuck, elaine",
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["all", "portraits", "sprites"],
        default="all",
        help="Generate portraits, sprites, or both (default: all)",
    )
    parser.add_argument(
        "--regenerate-base",
        action="store_true",
        help="Force Phase 1 re-generation even if base image exists",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print prompts without running generation",
    )
    parser.add_argument(
        "--strength-portrait",
        type=float,
        default=PORTRAIT_VARIANT_STRENGTH,
        help=f"img2img strength for portrait variants (default: {PORTRAIT_VARIANT_STRENGTH})",
    )
    parser.add_argument(
        "--strength-sprite",
        type=float,
        default=SPRITE_VARIANT_STRENGTH,
        help=f"img2img strength for sprite variants (default: {SPRITE_VARIANT_STRENGTH})",
    )
    args = parser.parse_args()

    # Allow runtime override of strength values
    portrait_strength = args.strength_portrait
    sprite_strength   = args.strength_sprite

    # Load character definitions
    with open(CHARACTERS_FILE, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    characters = data["characters"]

    if args.character:
        if args.character not in characters:
            print(f"Error: character '{args.character}' not in characters.yaml")
            print(f"Available: {', '.join(characters.keys())}")
            sys.exit(1)
        to_process = {args.character: characters[args.character]}
    else:
        to_process = characters

    for char_id, char_data in to_process.items():
        process_character(
            char_id=char_id,
            char_data=char_data,
            mode=args.mode,
            dry_run=args.dry_run,
            regenerate_base=args.regenerate_base,
            portrait_strength=portrait_strength,
            sprite_strength=sprite_strength,
        )

    print(f"\n{'='*60}")
    print(f"[done] Processed {len(to_process)} character(s), mode={args.mode}")
    if not args.dry_run:
        print(f"  Base images:   {BASE_DIR}")
        print(f"  Portraits:     {PORTRAITS_DIR}")
        print(f"  Sprites:       {SPRITES_DIR}")


if __name__ == "__main__":
    main()
