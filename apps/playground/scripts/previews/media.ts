/**
 * ffmpeg: crop the stage out of a device screenshot, scale it, and write the
 * published file.
 *
 * The crop rect is arithmetic, not measurement. The preview route centres a
 * full-width box of a known aspect on a screen of a known size, so where the
 * demo sits is a calculation — which means capture never depends on reading the
 * view hierarchy, and cannot drift when the accessibility tree changes shape.
 */

import { $ } from "bun";

/** Device-native pixels of a screenshot. */
export type DeviceGeometry = { width: number; height: number };

export type CropRect = { x: number; y: number; width: number; height: number };

/** Where the demo landed on screen, in points, as the app measured it. */
export type DemoBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
	windowWidth: number;
	windowHeight: number;
};

/** h264 needs even dimensions in both axes; an odd one fails the encode outright. */
function even(value: number): number {
	return Math.max(2, Math.round(value / 2) * 2);
}

/**
 * The crop, from what the app measured rather than from a per-demo guess.
 *
 * The preview route reports where the demo actually landed, so the padding
 * around it is the same on every card no matter how tall the demo is — and a
 * demo that grows a row does not silently start publishing a clipped picture,
 * which is exactly what a hand-tuned aspect ratio does.
 *
 * `padPoints` is added on every side. A stretched demo already carries the
 * screen gutter inside its measured width, so only the vertical padding is
 * really doing work there, but applying both keeps one rule.
 */
export function boundsCrop(geometry: DeviceGeometry, bounds: DemoBounds, padPoints: number): CropRect {
	const scale = geometry.width / bounds.windowWidth;
	const pad = padPoints * scale;

	const left = Math.max(0, bounds.x * scale - pad);
	const top = Math.max(0, bounds.y * scale - pad);
	const right = Math.min(geometry.width, (bounds.x + bounds.width) * scale + pad);
	const bottom = Math.min(geometry.height, (bounds.y + bounds.height) * scale + pad);

	return {
		height: even(bottom - top),
		width: even(right - left),
		x: even(left),
		y: even(top),
	};
}

/** The whole screen, for a demo that renders its own chrome or mounts into a portal. */
export function deviceCrop(geometry: DeviceGeometry): CropRect {
	return { height: even(geometry.height), width: even(geometry.width), x: 0, y: 0 };
}

/** Scales the long edge down to `maxEdge`, leaving anything already smaller alone. */
export function targetSize(crop: CropRect, maxEdge: number): { width: number; height: number } {
	const scale = Math.min(1, maxEdge / Math.max(crop.width, crop.height));
	return { height: even(crop.height * scale), width: even(crop.width * scale) };
}

function filter(crop: CropRect, size: { width: number; height: number }): string {
	return [
		`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,
		`scale=${size.width}:${size.height}:flags=lanczos`,
	].join(",");
}

export async function cropImage(
	input: string,
	output: string,
	crop: CropRect,
	size: { width: number; height: number }
): Promise<void> {
	const result =
		await $`ffmpeg -y -hide_banner -loglevel error -i ${input} -vf ${filter(crop, size)} -compression_level 100 ${output}`.quiet();
	if (result.exitCode !== 0) {
		throw new Error(`ffmpeg failed on ${input}:\n${result.stderr.toString()}`);
	}
}

export async function hasBinary(name: string): Promise<boolean> {
	return (await $`command -v ${name}`.quiet().nothrow()).exitCode === 0;
}

/**
 * Encodes the published clip: crop, scale, h264.
 *
 * `-movflags +faststart` puts the index at the front so playback can begin
 * before the file finishes downloading — which matters here because the docs
 * server answers a range request with the whole file.
 *
 * `libx264` rather than `h264_videotoolbox`: VideoToolbox encodes faster but
 * its rate control is visibly worse at these bitrates, and the encode is not
 * what makes a capture run slow.
 */
export async function encodeVideo(
	input: string,
	output: string,
	crop: CropRect,
	size: { width: number; height: number }
): Promise<void> {
	const result =
		await $`ffmpeg -y -hide_banner -loglevel error -i ${input} -vf ${filter(crop, size)} -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow -g 60 -keyint_min 60 -sc_threshold 0 -movflags +faststart -an -fps_mode cfr -r 30 ${output}`.quiet();
	if (result.exitCode !== 0) {
		throw new Error(`ffmpeg failed encoding ${input}:\n${result.stderr.toString()}`);
	}
}

/**
 * The poster, taken from the clip's own first frame.
 *
 * Not a separate screenshot: if the two disagree by even a frame, the poster
 * visibly flicks to the video the moment playback starts.
 */
export async function extractPoster(video: string, output: string): Promise<void> {
	const result =
		await $`ffmpeg -y -hide_banner -loglevel error -i ${video} -vframes 1 -compression_level 100 ${output}`.quiet();
	if (result.exitCode !== 0) {
		throw new Error(`ffmpeg failed extracting a poster from ${video}:\n${result.stderr.toString()}`);
	}
}

export async function probeDurationMs(path: string): Promise<number> {
	const result = await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${path}`.quiet();
	return Math.round(Number(result.stdout.toString().trim()) * 1000);
}
