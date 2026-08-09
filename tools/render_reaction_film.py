"""Render Statefold's original monochrome filament film.

The procedural volume is rendered offline with camera depth and spatial
supersampling. Production browsers only decode the final 60 fps video.
"""

from __future__ import annotations

import argparse
import math
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


@dataclass(frozen=True)
class Filament:
    points: np.ndarray
    width: float
    ink: int
    phase: float
    drift: np.ndarray


def smoothstep(edge0: float, edge1: float, value: float) -> float:
    value = min(1.0, max(0.0, (value - edge0) / (edge1 - edge0)))
    return value * value * (3.0 - 2.0 * value)


def vector_field(point: np.ndarray, phase: float) -> np.ndarray:
    x, y, z = point
    return np.array(
        [
            math.sin(y * 5.1 + phase) + math.cos(z * 7.3 - phase * 0.7),
            math.sin(z * 5.7 - phase * 0.4) + math.cos(x * 6.4 + phase),
            math.sin(x * 4.8 + phase * 0.8) + math.cos(y * 6.9 - phase),
        ],
        dtype=np.float64,
    )


def trace_path(
    rng: np.random.Generator,
    start: np.ndarray,
    heading: np.ndarray,
    phase: float,
    count: int,
    step: float,
    tether: np.ndarray,
) -> np.ndarray:
    point = start.copy()
    direction = heading / max(1e-6, np.linalg.norm(heading))
    path = np.empty((count, 3), dtype=np.float64)
    impulse = rng.normal(0.0, 0.16, 3)
    for index in range(count):
        if index and index % int(rng.integers(13, 29)) == 0:
            impulse = rng.normal(0.0, 0.42, 3)
        field = vector_field(point, phase + index * 0.018)
        spring = (tether - point) * 0.25
        desired = field * 0.46 + spring + impulse * 0.30
        desired /= max(1e-6, np.linalg.norm(desired))
        direction = direction * 0.82 + desired * 0.18
        direction /= max(1e-6, np.linalg.norm(direction))
        point = point + direction * step * (0.78 + 0.26 * math.sin(index * 0.11 + phase))
        path[index] = point
    return path


def build_filaments(seed: int = 2312) -> tuple[list[Filament], np.ndarray]:
    rng = np.random.default_rng(seed)
    filaments: list[Filament] = []
    anchors = np.column_stack(
        (
            rng.uniform(-1.22, 1.22, 34),
            rng.uniform(-0.82, 0.82, 34),
            rng.uniform(-0.86, 0.86, 34),
        )
    )

    for anchor_index, anchor in enumerate(anchors):
        phase = float(rng.uniform(0.0, math.tau))
        base_heading = vector_field(anchor, phase) + rng.normal(0.0, 0.50, 3)
        spine = trace_path(
            rng,
            anchor,
            base_heading,
            phase,
            int(rng.integers(92, 154)),
            float(rng.uniform(0.015, 0.025)),
            anchor,
        )
        filaments.append(
            Filament(spine, float(rng.uniform(1.15, 2.25)), int(rng.integers(4, 42)), phase, rng.normal(0, 0.018, 3))
        )

        family = int(rng.integers(7, 13))
        for branch_index in range(family):
            start_index = int(rng.integers(3, max(4, len(spine) - 22)))
            shared = spine[max(0, start_index - int(rng.integers(2, 8))) : start_index + 1]
            branch_heading = (
                spine[min(len(spine) - 1, start_index + 1)] - spine[max(0, start_index - 1)]
                + rng.normal(0.0, 0.75, 3)
            )
            branch = trace_path(
                rng,
                spine[start_index],
                branch_heading,
                phase + branch_index * 0.71,
                int(rng.integers(45, 112)),
                float(rng.uniform(0.012, 0.023)),
                anchor + rng.normal(0.0, 0.22, 3),
            )
            points = np.vstack((shared, branch))
            filaments.append(
                Filament(
                    points,
                    float(rng.choice([0.68, 0.82, 1.02, 1.28, 1.58])),
                    int(rng.integers(10, 96)),
                    phase + branch_index * 0.43,
                    rng.normal(0, 0.022, 3),
                )
            )

    dust = np.column_stack(
        (
            rng.uniform(-1.45, 1.45, 470),
            rng.uniform(-0.95, 0.95, 470),
            rng.uniform(-0.90, 0.90, 470),
        )
    )
    return filaments, dust


def camera_transform(points: np.ndarray, t: float, phase: float, drift: np.ndarray) -> np.ndarray:
    breathing = math.sin(t * 0.44 + phase) * 0.025
    animated = points.copy()
    animated[:, 0] += np.sin(points[:, 1] * 4.1 + t * 0.43 + phase) * 0.020 + drift[0] * math.sin(t * 0.31 + phase)
    animated[:, 1] += np.sin(points[:, 2] * 4.8 - t * 0.36 + phase) * 0.018 + drift[1] * math.cos(t * 0.27 + phase)
    animated[:, 2] += np.sin(points[:, 0] * 3.7 + t * 0.29 + phase) * 0.024 + drift[2] * math.sin(t * 0.23 + phase)

    yaw = -0.10 + t * 0.032
    pitch = 0.055 * math.sin(t * 0.23)
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    x = animated[:, 0] * cy + animated[:, 2] * sy
    z = -animated[:, 0] * sy + animated[:, 2] * cy
    y = animated[:, 1] * cp - z * sp
    z = animated[:, 1] * sp + z * cp
    z += breathing
    return np.column_stack((x, y, z))


def project(points: np.ndarray, width: int, height: int, t: float) -> tuple[list[tuple[int, int]], float]:
    camera_distance = 2.68 - t * 0.022
    depth = np.clip(camera_distance - points[:, 2], 1.25, 4.2)
    scale = 1.86 / depth
    horizontal = points[:, 0] * scale + math.sin(t * 0.19) * 0.055
    vertical = points[:, 1] * scale + math.cos(t * 0.17) * 0.028
    pixels = [
        (int((x * 0.64 + 0.5) * width), int((y * 0.94 + 0.5) * height))
        for x, y in zip(horizontal, vertical)
    ]
    return pixels, float(np.mean(points[:, 2]))


def render_frame(
    filaments: list[Filament],
    dust: np.ndarray,
    width: int,
    height: int,
    supersample: int,
    t: float,
    radial: np.ndarray,
    gradient: np.ndarray,
) -> Image.Image:
    render_width = width * supersample
    render_height = height * supersample
    layers = [Image.new("L", (render_width, render_height), 255) for _ in range(6)]
    drawers = [ImageDraw.Draw(layer) for layer in layers]

    for filament in filaments:
        transformed = camera_transform(filament.points, t, filament.phase, filament.drift)
        pixel_points, mean_depth = project(transformed, render_width, render_height, t)
        if len(pixel_points) < 2:
            continue
        depth_index = int(np.clip((mean_depth + 0.92) / 1.84 * 5.99, 0, 5))
        depth_gain = 0.70 + depth_index * 0.105
        width_px = max(1, int(round(filament.width * supersample * depth_gain)))
        ink = int(np.clip(filament.ink - depth_index * 8, 4, 190))
        drawers[depth_index].line(pixel_points, fill=ink, width=width_px, joint="curve")

        if depth_index >= 3 and len(pixel_points) > 38 and int(filament.phase * 100) % 5 == 0:
            for position in (len(pixel_points) // 3, len(pixel_points) * 2 // 3):
                node_x, node_y = pixel_points[position]
                radius = max(1, int((0.7 + depth_index * 0.13) * supersample))
                drawers[depth_index].ellipse(
                    (node_x - radius, node_y - radius, node_x + radius, node_y + radius),
                    fill=max(3, ink - 14),
                )

    dust_points = camera_transform(dust, t, 1.7, np.zeros(3))
    projected_dust, _ = project(dust_points, render_width, render_height, t)
    for point_index, ((x, y), z) in enumerate(zip(projected_dust, dust_points[:, 2])):
        if not (0 <= x < render_width and 0 <= y < render_height):
            continue
        depth_index = int(np.clip((z + 0.92) / 1.84 * 5.99, 0, 5))
        if (point_index + int(t * 12)) % 4:
            continue
        radius = max(1, int((0.30 + depth_index * 0.075) * supersample))
        tone = int(190 - depth_index * 19)
        drawers[depth_index].ellipse((x - radius, y - radius, x + radius, y + radius), fill=tone)

    blur = [5.8, 3.1, 1.55, 0.62, 0.20, 0.0]
    resolved: list[Image.Image] = []
    for index, layer in enumerate(layers):
        if blur[index]:
            layer = layer.filter(ImageFilter.GaussianBlur(blur[index] * supersample))
        resolved.append(layer)
    merged = resolved[0]
    for layer in resolved[1:]:
        merged = ImageChops.darker(merged, layer)
    merged = merged.resize((width, height), Image.Resampling.LANCZOS)

    pixels = np.asarray(merged, dtype=np.float32)
    intro = smoothstep(0.00, 0.72, t)
    center_clear = smoothstep(2.95, 3.45, t)
    global_clear = smoothstep(3.58, 4.58, t)
    center_mask = 1.0 - center_clear * np.exp(-radial * 2.4)
    opacity = intro * (1.0 - global_clear) * center_mask
    pixels = gradient - (255.0 - pixels) * opacity
    pixels = np.clip(pixels, 0, 255).astype(np.uint8)
    return Image.fromarray(pixels, mode="L").convert("RGB")


def encode(args: argparse.Namespace) -> None:
    import imageio_ffmpeg

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    mp4_output = output.with_suffix(".mp4")
    poster_output = output.with_name(f"{output.stem}-poster.jpg")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    filaments, dust = build_filaments(args.seed)

    yy, xx = np.mgrid[0 : args.height, 0 : args.width]
    nx = (xx / max(1, args.width - 1) - 0.5) * 0.80
    ny = (yy / max(1, args.height - 1) - 0.5) * 1.10
    radial = nx * nx + ny * ny
    vertical = yy / max(1, args.height - 1)
    gradient = 255.0 - 27.0 * smoothstep_array(0.44, 1.0, vertical)

    command = [
        ffmpeg, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s:v", f"{args.width}x{args.height}", "-r", str(args.fps),
        "-i", "-", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p",
        "-crf", str(args.crf), "-b:v", "0", "-deadline", "good",
        "-cpu-used", "2", "-row-mt", "1", "-threads", "8", str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    total_frames = int(round(args.duration * args.fps))
    poster_frame = int(round(1.10 * args.fps))
    try:
        for frame_index in range(total_frames):
            t = frame_index / args.fps
            frame = render_frame(filaments, dust, args.width, args.height, args.supersample, t, radial, gradient)
            if frame_index == poster_frame:
                frame.save(poster_output, quality=94, subsampling=0, optimize=True)
            process.stdin.write(np.asarray(frame, dtype=np.uint8).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("VP9 encoding failed")

    subprocess.run(
        [
            ffmpeg, "-y", "-i", str(output), "-an", "-c:v", "libx264",
            "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(mp4_output),
        ],
        check=True,
    )


def smoothstep_array(edge0: float, edge1: float, values: np.ndarray) -> np.ndarray:
    values = np.clip((values - edge0) / (edge1 - edge0), 0.0, 1.0)
    return values * values * (3.0 - 2.0 * values)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="media/reaction-field.webm")
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--fps", type=int, default=60)
    parser.add_argument("--duration", type=float, default=5.2)
    parser.add_argument("--supersample", type=int, default=2)
    parser.add_argument("--crf", type=int, default=28)
    parser.add_argument("--seed", type=int, default=2312)
    encode(parser.parse_args())


if __name__ == "__main__":
    main()
