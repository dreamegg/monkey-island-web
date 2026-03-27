#!/usr/bin/env python3
"""
픽셀아트 에셋 후처리 스크립트
- 해상도 정규화 (nearest neighbor)
- 팔레트 제한 (median cut quantization)
- 2x upscale for web display
- 투명 배경 처리 (스프라이트용)

사용법:
  python process.py input.png --target-size 320 200 --palette 32
  python process.py input.png --target-size 32 48 --palette 16 --transparent
  python process.py --batch-dir ./raw/ --type background
"""

import argparse
from pathlib import Path
from PIL import Image
import numpy as np


def quantize_to_palette(img: Image.Image, num_colors: int) -> Image.Image:
    """팔레트 제한 (median cut)"""
    if img.mode == "RGBA":
        # 알파 채널 보존
        alpha = img.split()[3]
        rgb = img.convert("RGB")
        rgb = rgb.quantize(colors=num_colors, method=Image.MEDIANCUT)
        rgb = rgb.convert("RGB")
        result = Image.merge("RGBA", (*rgb.split(), alpha))
        return result
    else:
        img = img.quantize(colors=num_colors, method=Image.MEDIANCUT)
        return img.convert("RGB")


def process_asset(
    input_path: str,
    target_size: tuple = (320, 200),
    palette_colors: int = 32,
    transparent: bool = False,
    upscale: int = 2,
    output_path: str = None,
):
    """에셋 후처리 파이프라인"""
    img = Image.open(input_path)
    print(f"[입력] {input_path} ({img.size[0]}x{img.size[1]}, {img.mode})")

    # 1. 투명 배경 처리
    if transparent and img.mode != "RGBA":
        img = img.convert("RGBA")

    # 2. 타겟 해상도로 리사이즈 (nearest neighbor = 픽셀 보존)
    img = img.resize(target_size, Image.NEAREST)
    print(f"[리사이즈] → {target_size[0]}x{target_size[1]}")

    # 3. 팔레트 제한
    img = quantize_to_palette(img, palette_colors)
    print(f"[팔레트] → {palette_colors}색")

    # 4. 2x upscale for web display
    display_size = (target_size[0] * upscale, target_size[1] * upscale)
    img = img.resize(display_size, Image.NEAREST)
    print(f"[업스케일] → {display_size[0]}x{display_size[1]} ({upscale}x)")

    # 5. 저장
    if output_path is None:
        p = Path(input_path)
        output_path = p.parent / f"{p.stem}_processed{p.suffix}"

    img.save(output_path, "PNG")
    print(f"[저장] {output_path}")
    return output_path


def apply_shared_palette(img: Image.Image, palette_path: str) -> Image.Image:
    """공유 팔레트 적용 (전체 게임 일관성)"""
    # TODO: .pal 파일에서 팔레트 로드 후 매핑
    pass


def extract_spritesheet_frames(
    input_path: str,
    frame_size: tuple = (32, 48),
    output_dir: str = "./frames/",
):
    """스프라이트 시트에서 개별 프레임 추출"""
    img = Image.open(input_path)
    fw, fh = frame_size
    cols = img.width // fw
    rows = img.height // fh

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    for r in range(rows):
        for c in range(cols):
            frame = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))
            frame.save(out / f"frame_{r}_{c}.png")

    print(f"[추출] {cols * rows} 프레임 → {output_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pixel Art Post-Processor")
    parser.add_argument("input", type=str, nargs="?", help="입력 이미지 경로")
    parser.add_argument("--target-size", nargs=2, type=int, default=[320, 200])
    parser.add_argument("--palette", type=int, default=32, help="팔레트 색상 수")
    parser.add_argument("--transparent", action="store_true", help="투명 배경 유지")
    parser.add_argument("--upscale", type=int, default=2, help="업스케일 배수")
    parser.add_argument("--output", type=str, default=None, help="출력 경로")
    parser.add_argument("--batch-dir", type=str, help="배치 처리 디렉토리")
    parser.add_argument("--type", choices=["background", "character", "object", "portrait"])
    args = parser.parse_args()

    TYPE_CONFIGS = {
        "background": {"target_size": (320, 200), "palette": 32, "transparent": False},
        "character":  {"target_size": (32, 48),   "palette": 16, "transparent": True},
        "object":     {"target_size": (32, 32),   "palette": 16, "transparent": True},
        "portrait":   {"target_size": (64, 64),   "palette": 16, "transparent": False},
    }

    if args.batch_dir and args.type:
        config = TYPE_CONFIGS[args.type]
        for p in Path(args.batch_dir).glob("*.png"):
            process_asset(str(p), **config)
    elif args.input:
        process_asset(
            args.input,
            target_size=tuple(args.target_size),
            palette_colors=args.palette,
            transparent=args.transparent,
            upscale=args.upscale,
            output_path=args.output,
        )
    else:
        parser.print_help()
