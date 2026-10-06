/**
 * The maths of paging through a run of slides on one fractional position.
 *
 * `position` is a float slide index: `1.4` is 40% of the way from the second
 * slide to the third. A drag writes it, a spring settles it, and everything drawn
 * is a reading of it. These functions are the whole of that arithmetic, shared by
 * every component that pages — `Carousel` today — so none of them restates it.
 *
 * **Every function is a self-contained worklet.** Each is marked `"worklet"` so
 * a gesture callback or an animated style can call it on the UI thread, and none
 * calls another: a module-scope worklet calling a second one binds its closure at
 * import time and finds `undefined` on the UI thread — a crash no unit test sees,
 * because the JS thread resolves it perfectly (see `pressable/AGENTS.md`). That is
 * why the rubber band is written out again inside {@link resolvePanPosition}
 * rather than called. Module constants are plain numbers and are captured fine.
 *
 * Pure: no React, no React Native, no Reanimated — `bun test` reaches all of it.
 */

/** The furthest a rubber band ever gives past an end, in slides. */
export const PAGING_RUBBER_BAND_MAX = 0.5;

/** A release faster than this, in points per second, commits to the next slide. */
export const PAGING_COMMIT_VELOCITY = 300;

/** A drag further than this fraction of a slide commits to the next slide. */
export const PAGING_COMMIT_DISTANCE = 0.25;

/**
 * How far slide `i` sits from `position` on a ring of `count`, in slides — the
 * short way round, within half the ring either side.
 *
 * This is what makes a loop with no clones and no jump-reset: a slide is drawn at
 * its wrapped offset, so the first slide is simply to the right of the last one
 * and positions a whole ring apart draw identically.
 */
export function resolveWrappedOffset(i: number, position: number, count: number): number {
	"worklet";
	const raw = i - position;
	if (count <= 1) return count === 1 ? raw : 0;

	let offset = raw % count;
	if (offset < 0) offset += count;
	if (offset > count / 2) offset -= count;
	return offset;
}

/**
 * The slide nearest `position`: wrapped round the ring when looping, clamped to
 * the ends when not. Never negative zero, so it compares and keys cleanly.
 */
export function resolveIndexFromPosition(position: number, count: number, loop: boolean): number {
	"worklet";
	if (count <= 0) return 0;

	const nearest = Math.round(position);
	if (loop) {
		const wrapped = ((nearest % count) + count) % count;
		return wrapped + 0;
	}

	if (nearest <= 0) return 0;
	if (nearest >= count - 1) return count - 1;
	return nearest;
}

/**
 * The position congruent to `index` that is nearest `position` — where to spring
 * to so a loop goes the short way round. `4 → 0` on a ring of five is `5`, one
 * slide forward, not four back. Without a ring (`count <= 1`) it is the index.
 */
export function resolveNearestPosition(position: number, index: number, count: number): number {
	"worklet";
	if (count <= 1) return index;
	const turns = Math.round((position - index) / count);
	return index + turns * count;
}

/**
 * The give past an end, in slides, for an overscroll in slides.
 *
 * Exponential towards {@link PAGING_RUBBER_BAND_MAX}: starts at the finger's own
 * rate, always gives less than it was asked, never more than half a slide. A hard
 * clamp reads as a dropped gesture — the slide stops dead under a finger that is
 * still moving. Odd, so a pull either way mirrors.
 */
export function resolveRubberBand(overscroll: number): number {
	"worklet";
	const max = PAGING_RUBBER_BAND_MAX;
	const magnitude = max * (1 - Math.exp(-Math.abs(overscroll) / max));
	return overscroll < 0 ? -magnitude : magnitude;
}

/**
 * The start position a drag resumes from, back-computed at activation.
 *
 * A pan's translation is measured from touch-down but it only activates after
 * some travel. Taking `position` as the start would apply that travel twice and
 * jump the slide on the first frame; this is the start that makes
 * {@link resolvePanPosition} return the position the slide is already at —
 * mid-spring or at rest.
 */
export function resolvePanOrigin(position: number, translation: number, pitch: number): number {
	"worklet";
	if (pitch <= 0) return position;
	return position + translation / pitch;
}

/**
 * `position` while a finger is down: the drag in slides, against the pointer.
 *
 * Looping runs free past either end (the wrapped offsets make that seamless); a
 * run that does not loop rubber-bands past its ends. The band is
 * {@link resolveRubberBand} written out again, for the reason the module doc gives.
 */
export function resolvePanPosition(state: {
	start: number;
	translation: number;
	pitch: number;
	count: number;
	loop: boolean;
}): number {
	"worklet";
	if (state.pitch <= 0 || state.count <= 0) return state.start;

	const raw = state.start - state.translation / state.pitch;
	if (state.loop) return raw;

	const max = state.count - 1;
	const band = PAGING_RUBBER_BAND_MAX;
	if (raw < 0) return -band * (1 - Math.exp(raw / band));
	if (raw > max) return max + band * (1 - Math.exp(-(raw - max) / band));
	return raw;
}

/**
 * Where the run settles when the finger lifts.
 *
 * `velocity` is in points per second with the pointer's sign — a leftward
 * (upward) flick is negative and moves forward. Two rules, and **neither ever
 * moves more than one slide from `startIndex`**:
 *
 * - A release faster than {@link PAGING_COMMIT_VELOCITY} is an instruction: it
 *   goes to the next slide boundary in its direction, so a flick back against a
 *   drag returns to where it started.
 * - Otherwise a drag further than {@link PAGING_COMMIT_DISTANCE} of a slide
 *   commits in its direction; anything shorter springs back.
 *
 * Looping may return `-1` or `count` — the spring goes there and the caller wraps
 * the committed index. Not looping, it is clamped to the ends.
 */
export function resolveSettleTarget(state: {
	position: number;
	startIndex: number;
	velocity: number;
	pitch: number;
	count: number;
	loop: boolean;
}): number {
	"worklet";
	if (state.count <= 0) return 0;

	const { position, startIndex } = state;
	const delta = position - startIndex;
	let target = startIndex;

	if (Math.abs(state.velocity) > PAGING_COMMIT_VELOCITY) {
		target = state.velocity < 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1;
	} else if (delta > PAGING_COMMIT_DISTANCE) {
		target = startIndex + 1;
	} else if (delta < -PAGING_COMMIT_DISTANCE) {
		target = startIndex - 1;
	}

	if (target > startIndex + 1) target = startIndex + 1;
	if (target < startIndex - 1) target = startIndex - 1;

	if (!state.loop) {
		if (target < 0) target = 0;
		if (target > state.count - 1) target = state.count - 1;
	}

	return target + 0;
}

/**
 * The slides worth mounting: `windowSize` either side of `index`, wrapped round
 * the ring when looping and clipped at the ends when not, in travel order. When
 * the window covers the whole run it is every slide, in source order.
 *
 * Read from the committed index on the JS thread — it decides what React mounts,
 * not what the UI thread draws.
 */
export function resolveVisibleRange(index: number, count: number, loop: boolean, windowSize: number): number[] {
	"worklet";
	const out: number[] = [];
	if (count <= 0) return out;

	if (count <= 2 * windowSize + 1) {
		for (let i = 0; i < count; i++) out.push(i);
		return out;
	}

	for (let i = index - windowSize; i <= index + windowSize; i++) {
		if (loop) out.push(((i % count) + count) % count);
		else if (i >= 0 && i < count) out.push(i);
	}
	return out;
}
