#!/usr/bin/env python3
"""
FLUX.1-dev + PixelArt LoRA Asset Generator
Monkey Island Web - Phase 3 Asset Pipeline

Usage:
  python generate.py --type background --name harbor
  python generate.py --type character --name guybrush
  python generate.py --type object --name barrel
  python generate.py --type portrait --name guybrush_neutral
  python generate.py --type all --batch
  python generate.py --batch prompts.yaml
  python generate.py --type background --name harbor --img2img reference.png --strength 0.6
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Optional

import yaml

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL_ID = "black-forest-labs/FLUX.1-dev"
LORA_ID = "nerijs/pixel-art-xl"
LORA_WEIGHT = 0.85  # LoRA influence scale

PIPELINE_DIR = Path(__file__).parent
OUTPUT_DIR = PIPELINE_DIR / "../../src/assets"
PROMPTS_FILE = PIPELINE_DIR / "prompts.yaml"
PALETTE_FILE = PIPELINE_DIR / "palette.pal"

# Asset type → generation config
ASSET_CONFIGS: dict[str, dict[str, Any]] = {
    "background": {
        "gen_width": 320,
        "gen_height": 208,  # must be divisible by 16 for FLUX
        "target_size": (320, 200),
        "display_size": (640, 400),
        "palette_colors": 32,
        "num_inference_steps": 28,
        "guidance_scale": 3.5,  # FLUX uses lower CFG
        "style_suffix": (
            "pixel art background scene, 16-bit point-and-click adventure game, "
            "lucasarts monkey island style, EGA color palette, atmospheric, detailed, "
            "no characters, no text, no UI"
        ),
        "negative": (
            "3d, realistic, photograph, blurry, anti-aliased, modern, characters, "
            "people, text, watermark, UI, HUD, smooth gradients"
        ),
        "output_subdir": "backgrounds",
        "transparent": False,
    },
    "character": {
        "gen_width": 256,
        "gen_height": 384,
        "target_size": (32, 48),
        "display_size": (64, 96),
        "palette_colors": 16,
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "style_suffix": (
            "pixel art character sprite, side view walking pose, "
            "lucasarts adventure game style, transparent background, "
            "clean pixel edges, single character, centered"
        ),
        "negative": (
            "3d, realistic, blurry, background scene, multiple characters, "
            "anti-aliased, text, watermark, modern style"
        ),
        "output_subdir": "sprites",
        "transparent": True,
    },
    "object": {
        "gen_width": 256,
        "gen_height": 256,
        "target_size": (32, 32),
        "display_size": (64, 64),
        "palette_colors": 16,
        "num_inference_steps": 25,
        "guidance_scale": 3.5,
        "style_suffix": (
            "pixel art game object, inventory item style, "
            "transparent background, clean pixel edges, centered, "
            "adventure game prop"
        ),
        "negative": (
            "3d, realistic, blurry, background, character, person, "
            "anti-aliased, text, watermark, modern style"
        ),
        "output_subdir": "objects",
        "transparent": True,
    },
    "inventory": {
        "gen_width": 192,
        "gen_height": 192,
        "target_size": (24, 24),
        "display_size": (48, 48),
        "palette_colors": 16,
        "num_inference_steps": 25,
        "guidance_scale": 3.5,
        "style_suffix": (
            "pixel art inventory icon, tiny game icon, very small sprite, "
            "transparent background, clear readable silhouette, adventure game"
        ),
        "negative": (
            "3d, realistic, blurry, background, character, person, "
            "anti-aliased, text, watermark, complex details"
        ),
        "output_subdir": "inventory",
        "transparent": True,
    },
    "portrait": {
        "gen_width": 256,
        "gen_height": 256,
        "target_size": (64, 64),
        "display_size": (128, 128),
        "palette_colors": 16,
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "style_suffix": (
            "pixel art character portrait, close-up face, dialogue box style, "
            "lucasarts adventure game, expressive face, bust shot"
        ),
        "negative": (
            "3d, realistic, blurry, full body, background scene, "
            "anti-aliased, text, watermark, modern style"
        ),
        "output_subdir": "portraits",
        "transparent": False,
    },
}

# Seed ranges per category for reproducibility
SEED_RANGES = {
    "background": (1000, 1999),
    "character": (2000, 2999),
    "object": (3000, 3999),
    "inventory": (4000, 4999),
    "portrait": (5000, 5999),
}


# ---------------------------------------------------------------------------
# Prompt loading
# ---------------------------------------------------------------------------

def load_prompts() -> dict[str, Any]:
    """Load and return the prompts.yaml data."""
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f)


def resolve_prompt(
    prompts: dict[str, Any],
    asset_type: str,
    name: str,
) -> tuple[str, int]:
    """
    Look up prompt and seed for a given asset type + name.

    Returns (description, seed).
    """
    # Map CLI type names to YAML section names
    section_map = {
        "background": "backgrounds",
        "character": "characters",
        "object": "objects",
        "inventory": "inventory_icons",
        "portrait": "portraits",
    }
    section_key = section_map.get(asset_type, asset_type)
    section = prompts.get(section_key, {})

    if name not in section:
        available = list(section.keys())
        raise ValueError(
            f"Asset '{name}' not found in [{section_key}]. "
            f"Available: {available}"
        )

    entry = section[name]
    description = entry["description"].strip().replace("\n", " ")
    seed = entry.get("seed", -1)
    return description, seed


def build_prompt(description: str, asset_type: str, prompts: dict[str, Any]) -> str:
    """Combine description with style suffix from config."""
    config = ASSET_CONFIGS[asset_type]
    style_base = prompts.get("style", {}).get("pixel_art_base", "").strip()
    style_suffix = config["style_suffix"]
    parts = [p for p in [description, style_base, style_suffix] if p]
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Pipeline loader (lazy import so script is importable without GPU deps)
# ---------------------------------------------------------------------------

_pipeline_cache: dict[str, Any] = {}


def load_pipeline(img2img: bool = False) -> Any:
    """Load FLUX pipeline with PixelArt LoRA. Cached after first call.

    Uses enable_model_cpu_offload() to keep model weights on CPU and move
    layers to GPU on demand. This allows running on machines with limited
    RAM (16 GB) + GPU VRAM (16 GB) without OOM.
    """
    import torch
    from diffusers import FluxImg2ImgPipeline, FluxPipeline

    cache_key = "img2img" if img2img else "txt2img"
    if cache_key in _pipeline_cache:
        return _pipeline_cache[cache_key]

    print(f"[pipeline] Loading {MODEL_ID} ...")
    dtype = torch.bfloat16

    if img2img:
        pipe = FluxImg2ImgPipeline.from_pretrained(
            MODEL_ID, torch_dtype=dtype, low_cpu_mem_usage=True,
            local_files_only=True,
        )
    else:
        pipe = FluxPipeline.from_pretrained(
            MODEL_ID, torch_dtype=dtype, low_cpu_mem_usage=True,
            local_files_only=True,
        )

    # LoRA loading (optional -- skip if not FLUX-compatible)
    try:
        print(f"[pipeline] Loading LoRA: {LORA_ID}")
        pipe.load_lora_weights(LORA_ID)
        pipe.fuse_lora(lora_scale=LORA_WEIGHT)
        print("[pipeline] LoRA applied")
    except Exception as e:
        print(f"[pipeline] LoRA skipped (not compatible): {e}")
        print("[pipeline] Using FLUX base model with pixel art prompts only")

    # Sequential CPU offload: moves one layer at a time to GPU.
    # Uses minimal VRAM (~3-4 GB) at the cost of slower inference.
    print("[pipeline] Enabling sequential CPU offload (minimal VRAM mode) ...")
    pipe.enable_sequential_cpu_offload()

    _pipeline_cache[cache_key] = pipe
    return pipe


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def generate_single(
    asset_type: str,
    name: str,
    description: str,
    seed: int = -1,
    img2img_path: Optional[str] = None,
    img2img_strength: float = 0.65,
    dry_run: bool = False,
    skip_process: bool = False,
) -> Path:
    """
    Generate a single asset using FLUX.1-dev + PixelArt LoRA.

    Args:
        asset_type:        One of background/character/object/inventory/portrait.
        name:              Asset name (used for output filename).
        description:       Base image description text.
        seed:              RNG seed (-1 = random).
        img2img_path:      Optional reference image for img2img mode.
        img2img_strength:  Denoising strength for img2img (0.0-1.0).
        dry_run:           Print prompt without running generation.
        skip_process:      Skip post-processing step.

    Returns:
        Path to the generated (and optionally processed) file.
    """
    import torch

    if asset_type not in ASSET_CONFIGS:
        raise ValueError(f"Unknown asset type: {asset_type}. Valid: {list(ASSET_CONFIGS)}")

    config = ASSET_CONFIGS[asset_type]
    prompts = load_prompts()
    full_prompt = build_prompt(description, asset_type, prompts)
    negative = config["negative"]

    # Resolve seed
    if seed < 0:
        import random
        lo, hi = SEED_RANGES.get(asset_type, (0, 9999))
        seed = random.randint(lo, hi)

    print(f"\n[generate] type={asset_type}  name={name}  seed={seed}")
    print(f"[generate] prompt: {full_prompt[:120]}...")
    print(f"[generate] size: {config['gen_width']}x{config['gen_height']}")

    if dry_run:
        print("[generate] DRY RUN - skipping actual generation")
        return Path(f"dry_run_{asset_type}_{name}.png")

    # Output path
    output_dir = OUTPUT_DIR / config["output_subdir"] / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{name}.png"

    t0 = time.time()

    use_img2img = img2img_path is not None
    pipe = load_pipeline(img2img=use_img2img)

    generator = torch.Generator("cuda" if torch.cuda.is_available() else "cpu")
    generator = generator.manual_seed(seed)

    if use_img2img:
        from PIL import Image as PILImage
        ref_img = PILImage.open(img2img_path).convert("RGB")
        ref_img = ref_img.resize(
            (config["gen_width"], config["gen_height"]),
            PILImage.LANCZOS,
        )
        image = pipe(
            prompt=full_prompt,
            image=ref_img,
            strength=img2img_strength,
            num_inference_steps=config["num_inference_steps"],
            guidance_scale=config["guidance_scale"],
            generator=generator,
        ).images[0]
    else:
        image = pipe(
            prompt=full_prompt,
            width=config["gen_width"],
            height=config["gen_height"],
            num_inference_steps=config["num_inference_steps"],
            guidance_scale=config["guidance_scale"],
            generator=generator,
        ).images[0]

    image.save(output_path)
    elapsed = time.time() - t0
    print(f"[generate] saved raw → {output_path}  ({elapsed:.1f}s)")

    # Save generation metadata
    meta_path = output_path.with_suffix(".json")
    meta = {
        "name": name,
        "type": asset_type,
        "seed": seed,
        "prompt": full_prompt,
        "negative": negative,
        "gen_size": [config["gen_width"], config["gen_height"]],
        "target_size": list(config["target_size"]),
        "display_size": list(config["display_size"]),
        "img2img": img2img_path,
        "img2img_strength": img2img_strength if use_img2img else None,
        "elapsed_s": round(elapsed, 2),
    }
    meta_path.write_text(json.dumps(meta, indent=2))

    # Post-process
    if not skip_process:
        from process import process_asset
        processed = process_asset(
            input_path=str(output_path),
            target_size=config["target_size"],
            palette_colors=config["palette_colors"],
            transparent=config["transparent"],
            upscale=2,
            palette_file=str(PALETTE_FILE) if PALETTE_FILE.exists() else None,
            output_path=str(
                OUTPUT_DIR / config["output_subdir"] / f"{name}.png"
            ),
        )
        return Path(processed)

    return output_path


def generate_batch_from_yaml(yaml_path: str, dry_run: bool = False) -> list[Path]:
    """
    Generate all assets listed under batch_groups.assets in prompts.yaml,
    or from a flat assets list in a custom yaml file.
    """
    with open(yaml_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # Support both the full prompts.yaml structure and simple flat lists
    asset_list = data.get("assets", [])
    if not asset_list and "batch_groups" in data:
        asset_list = data["batch_groups"].get("assets", [])

    results: list[Path] = []
    prompts_data = load_prompts()

    for item in asset_list:
        asset_type = item["type"]
        name = item["name"]
        try:
            description, seed = resolve_prompt(prompts_data, asset_type, name)
            path = generate_single(
                asset_type=asset_type,
                name=name,
                description=description,
                seed=seed,
                dry_run=dry_run,
            )
            results.append(path)
        except Exception as exc:
            print(f"[ERROR] {asset_type}/{name}: {exc}", file=sys.stderr)

    return results


def generate_batch_by_type(asset_type: str, dry_run: bool = False) -> list[Path]:
    """Generate all assets of a given type defined in prompts.yaml."""
    section_map = {
        "background": "backgrounds",
        "character": "characters",
        "object": "objects",
        "inventory": "inventory_icons",
        "portrait": "portraits",
    }
    prompts_data = load_prompts()
    section_key = section_map.get(asset_type, asset_type)
    section = prompts_data.get(section_key, {})

    results: list[Path] = []
    for name in section:
        try:
            description, seed = resolve_prompt(prompts_data, asset_type, name)
            path = generate_single(
                asset_type=asset_type,
                name=name,
                description=description,
                seed=seed,
                dry_run=dry_run,
            )
            results.append(path)
        except Exception as exc:
            print(f"[ERROR] {asset_type}/{name}: {exc}", file=sys.stderr)

    return results


def generate_all(dry_run: bool = False) -> list[Path]:
    """Generate every asset defined in prompts.yaml."""
    results: list[Path] = []
    for asset_type in ASSET_CONFIGS:
        results.extend(generate_batch_by_type(asset_type, dry_run=dry_run))
    return results


def generate_room(room_name: str, dry_run: bool = False) -> list[Path]:
    """Generate all assets for a named room batch group."""
    prompts_data = load_prompts()
    batch_groups = prompts_data.get("batch_groups", {})
    group_key = f"room_{room_name}"

    if group_key not in batch_groups:
        available = [k.removeprefix("room_") for k in batch_groups if k.startswith("room_")]
        raise ValueError(f"Room '{room_name}' not found. Available: {available}")

    group = batch_groups[group_key]
    results: list[Path] = []

    for ref in group:
        # ref format: "backgrounds.harbor" or "objects.barrel"
        section_key, name = ref.split(".")
        type_map = {
            "backgrounds": "background",
            "characters": "character",
            "objects": "object",
            "inventory_icons": "inventory",
            "portraits": "portrait",
        }
        asset_type = type_map.get(section_key)
        if asset_type is None:
            print(f"[WARN] Unknown section key: {section_key}", file=sys.stderr)
            continue

        try:
            description, seed = resolve_prompt(prompts_data, asset_type, name)
            path = generate_single(
                asset_type=asset_type,
                name=name,
                description=description,
                seed=seed,
                dry_run=dry_run,
            )
            results.append(path)
        except Exception as exc:
            print(f"[ERROR] {section_key}/{name}: {exc}", file=sys.stderr)

    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="FLUX.1-dev + PixelArt LoRA Asset Generator for Monkey Island Web",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a single named asset
  python generate.py --type background --name harbor
  python generate.py --type character --name guybrush
  python generate.py --type portrait --name guybrush_neutral

  # Batch: all assets of one type
  python generate.py --type background --batch

  # Batch: all assets for a room
  python generate.py --room harbor

  # Batch: everything
  python generate.py --type all --batch

  # From custom yaml
  python generate.py --batch prompts.yaml

  # img2img mode (style reference)
  python generate.py --type background --name tavern --img2img ref.png --strength 0.65

  # Dry run (print prompts only)
  python generate.py --type all --batch --dry-run
        """,
    )

    parser.add_argument(
        "--type",
        choices=list(ASSET_CONFIGS) + ["all"],
        help="Asset type to generate.",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="Asset name (must exist in prompts.yaml for the given type).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=-1,
        help="RNG seed (-1 = use seed from prompts.yaml or random).",
    )
    parser.add_argument(
        "--batch",
        nargs="?",
        const=True,
        metavar="YAML_FILE",
        help=(
            "Batch mode. Without argument: generate all assets of --type. "
            "With YAML path: use that file's asset list."
        ),
    )
    parser.add_argument(
        "--room",
        type=str,
        metavar="ROOM_NAME",
        help="Generate all assets for a room (harbor/tavern/forest/beach/cave).",
    )
    parser.add_argument(
        "--img2img",
        type=str,
        metavar="IMAGE_PATH",
        help="Reference image path for img2img style transfer.",
    )
    parser.add_argument(
        "--strength",
        type=float,
        default=0.65,
        help="img2img denoising strength (0.0-1.0). Default: 0.65.",
    )
    parser.add_argument(
        "--skip-process",
        action="store_true",
        help="Skip post-processing step (save raw generation only).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print prompts without running generation.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Override output directory (default: ../../src/assets).",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    global OUTPUT_DIR
    if args.output_dir:
        OUTPUT_DIR = Path(args.output_dir)

    # Route to appropriate generation mode
    if args.room:
        results = generate_room(args.room, dry_run=args.dry_run)
        print(f"\n[done] Generated {len(results)} assets for room '{args.room}'")

    elif args.batch and isinstance(args.batch, str):
        # --batch path/to/file.yaml
        results = generate_batch_from_yaml(args.batch, dry_run=args.dry_run)
        print(f"\n[done] Generated {len(results)} assets from {args.batch}")

    elif args.type == "all" and args.batch:
        results = generate_all(dry_run=args.dry_run)
        print(f"\n[done] Generated {len(results)} total assets")

    elif args.type and args.batch:
        results = generate_batch_by_type(args.type, dry_run=args.dry_run)
        print(f"\n[done] Generated {len(results)} {args.type} assets")

    elif args.type and args.name:
        prompts_data = load_prompts()
        description, seed = resolve_prompt(prompts_data, args.type, args.name)
        if args.seed >= 0:
            seed = args.seed  # CLI seed overrides yaml seed
        result = generate_single(
            asset_type=args.type,
            name=args.name,
            description=description,
            seed=seed,
            img2img_path=args.img2img,
            img2img_strength=args.strength,
            dry_run=args.dry_run,
            skip_process=args.skip_process,
        )
        print(f"\n[done] {result}")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
