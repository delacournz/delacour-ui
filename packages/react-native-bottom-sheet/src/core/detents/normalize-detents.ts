import { err, ok, type Result } from "../result";
import type { DetentSpec } from "../sheet.types";

/** A detent with its unit made explicit. */
export type ParsedDetent = { kind: "px"; value: number } | { kind: "percent"; value: number };

/** Why a detent could not be read. `value` is what the consumer wrote. */
export type DetentError = { code: "invalid-snap-point"; value: unknown };

/**
 * Reads one detent as the consumer wrote it — `300` or `"50%"` — refusing
 * `NaN`, infinities, negatives and any string that is not a percentage.
 *
 * This is the JS-thread validator, for `snapToPosition` and for surfacing a
 * bad `snapPoints` prop by name. The worklet below re-implements the same
 * parse inline, because a module-scope worklet may not call it.
 */
export function parseDetent(spec: DetentSpec): Result<ParsedDetent, DetentError> {
	if (typeof spec === "number") {
		if (!Number.isFinite(spec) || spec < 0) return err({ code: "invalid-snap-point", value: spec });
		return ok({ kind: "px", value: spec });
	}
	if (typeof spec === "string") {
		const match = /^(\d+(?:\.\d+)?)%$/.exec(spec);
		if (match === null) return err({ code: "invalid-snap-point", value: spec });
		return ok({ kind: "percent", value: Number(match[1]) });
	}
	return err({ code: "invalid-snap-point", value: spec });
}

/**
 * Resolves a `snapPoints` spec into ascending, unique heights, each clamped
 * to `[0, available]`.
 *
 * `available` is the height the sheet may occupy — the container height less
 * the resting bottom for a detached sheet. While it is unmeasured (or zero)
 * there is nothing to snap to, and the result is empty rather than a list of
 * zeros. An invalid entry is skipped, never written into the list: one `NaN`
 * in `detents` freezes a sheet.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the flat-worklet rule forbids extracting helpers; see the doc comment above.
export function normalizeDetents(spec: readonly DetentSpec[], available: number): number[] {
	"worklet";
	if (!(available > 0)) return [];

	const heights: number[] = [];
	for (let index = 0; index < spec.length; index += 1) {
		const entry = spec[index];
		let height = Number.NaN;
		if (typeof entry === "number") {
			height = entry;
		} else if (typeof entry === "string" && entry.length > 1 && entry.charCodeAt(entry.length - 1) === 37) {
			height = (Number(entry.slice(0, -1)) / 100) * available;
		}
		if (!Number.isFinite(height)) continue;

		const clamped = height < 0 ? 0 : height > available ? available : height;
		if (heights.indexOf(clamped) === -1) heights.push(clamped);
	}

	heights.sort((a, b) => a - b);
	return heights;
}
