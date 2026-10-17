/**
 * The pure arithmetic behind a capture: reading the preview route's sentinel
 * back into a crop rect, and turning a flow's normalized gesture into the
 * points warden drives.
 *
 * Free of the warden API so `bun test` can hold it still.
 */

import type { DemoBounds } from "../../scripts/previews/media";

/** Window size in points, as the sentinel reports it. */
export type Window = { width: number; height: number };

/**
 * Pulls the demo's measured rect out of the sentinel's accessibility label.
 *
 * The label is `preview-ready:<id>:<theme>:<x>,<y>,<w>,<h>:<winW>x<winH>`, all
 * in points. Points rather than pixels because that is what React Native
 * measures in; the caller scales by the screenshot's own width.
 */
export function parseBounds(label: string, sentinel: string): DemoBounds | undefined {
	const index = label.indexOf(sentinel);
	if (index === -1) return undefined;
	const match = label.slice(index + sentinel.length).match(/^(-?\d+),(-?\d+),(\d+),(\d+):(\d+)x(\d+)/);
	if (!match) return undefined;
	const [x, y, width, height, windowWidth, windowHeight] = match.slice(1).map(Number) as [
		number,
		number,
		number,
		number,
		number,
		number,
	];
	return { height, width, windowHeight, windowWidth, x, y };
}

/** A flow's gesture waypoint: screen fractions, and the pause before reaching it. */
export type GestureEvent = {
	type: "down" | "move" | "up";
	x: number;
	y: number;
	/** Milliseconds after the previous event. Ignored on the `down`. */
	delayMs?: number;
};

/** One finger's route in points, timed from touch-down — the shape warden's `gesture` takes. */
export type TouchPath = { points: { x: number; y: number; t: number }[] };

/** A normalized (0–1) screen position, in points. */
export function toPoint(nx: number, ny: number, window: Window): { x: number; y: number } {
	return { x: Math.round(nx * window.width * 100) / 100, y: Math.round(ny * window.height * 100) / 100 };
}

/**
 * Turns a flow's event list into one timed touch path.
 *
 * The flows were written for a driver that took `Down`, `Move` and `Up` with a
 * pause before each; warden takes points on a timeline and samples the route
 * every 16 ms itself, so the pauses become cumulative times and the old
 * `interpolate` count is redundant. A pause on a `move` that does not move —
 * the 500 ms hold that arms a chart's scrub — is kept by repeating the point.
 */
export function toTouchPath(events: readonly GestureEvent[], window: Window): TouchPath {
	if (events.length === 0) throw new Error("a gesture needs at least a down and an up");
	if (events[0]?.type !== "down") throw new Error("a gesture must start with a down");
	if (events.at(-1)?.type !== "up") throw new Error("a gesture must end with an up");
	let t = 0;
	const points = events.map((event, index) => {
		if (index > 0) t += Math.max(0, event.delayMs ?? 0);
		return { ...toPoint(event.x, event.y, window), t };
	});
	return { points };
}

/** A point in screen points. */
export type Point = { x: number; y: number };

/** One sample per 16 ms frame, which is the rate the driver replays a route at. */
const DRAG_SAMPLES_PER_SECOND = 60;

/**
 * A momentum-free drag: the finger decelerates into `to` and then rests there
 * before lifting, so the OS reads no release velocity and nothing flings. The
 * old flows asked for this with `momentum: false`; warden's `swipe` has no such
 * switch, but its timed `gesture.path` replays a route exactly, so the
 * deceleration is written into the route — a cubic ease-out sampled per frame,
 * then the end point repeated `holdMs` later.
 */
export function dragPath(from: Point, to: Point, options: { durationMs?: number; holdMs?: number } = {}): TouchPath {
	const durationMs = Math.max(16, options.durationMs ?? 300);
	const holdMs = Math.max(0, options.holdMs ?? 150);
	const samples = Math.max(2, Math.round((durationMs / 1000) * DRAG_SAMPLES_PER_SECOND));
	const points: TouchPath["points"] = [];
	for (let index = 0; index <= samples; index += 1) {
		const progress = index / samples;
		const eased = 1 - (1 - progress) ** 3;
		points.push({
			t: Math.round(progress * durationMs),
			x: Math.round((from.x + (to.x - from.x) * eased) * 100) / 100,
			y: Math.round((from.y + (to.y - from.y) * eased) * 100) / 100,
		});
	}
	if (holdMs > 0) points.push({ ...to, t: durationMs + holdMs });
	return { points };
}
