/**
 * The `[min, max]` of everything finite in `values`, or `null` when nothing is.
 *
 * `null` rather than `[0, 0]` because an empty series and a series that is
 * genuinely all zeroes need different domains, and collapsing them here would
 * make that impossible to tell apart later.
 */
export function extent(values: Iterable<number | null | undefined>): readonly [number, number] | null {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	let seen = false;

	for (const value of values) {
		if (typeof value !== "number" || !Number.isFinite(value)) continue;
		seen = true;
		if (value < min) min = value;
		if (value > max) max = value;
	}

	return seen ? [min, max] : null;
}

/** The union of several extents, skipping the empty ones. */
export function unionExtents(extents: Iterable<readonly [number, number] | null>): readonly [number, number] | null {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	let seen = false;

	for (const current of extents) {
		if (current === null) continue;
		seen = true;
		if (current[0] < min) min = current[0];
		if (current[1] > max) max = current[1];
	}

	return seen ? [min, max] : null;
}
