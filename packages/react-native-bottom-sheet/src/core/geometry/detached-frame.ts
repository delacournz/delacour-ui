/** The `detached` prop as the consumer writes it. */
export type DetachedProp = boolean | { horizontalMargin?: number; bottomOffset?: number } | undefined;

/** A detached sheet's geometry, every field filled in. */
export type DetachedOptions = { horizontalMargin: number; bottomOffset: number };

/** What `detached: true` means. */
export const DETACHED_DEFAULTS: DetachedOptions = { horizontalMargin: 16, bottomOffset: 16 };

/** The `detached` prop resolved: `null` when attached, full options when floating. */
export function resolveDetached(detached: DetachedProp): DetachedOptions | null {
	if (detached === undefined || detached === false) return null;
	if (detached === true) return DETACHED_DEFAULTS;
	return {
		horizontalMargin: detached.horizontalMargin ?? DETACHED_DEFAULTS.horizontalMargin,
		bottomOffset: detached.bottomOffset ?? DETACHED_DEFAULTS.bottomOffset,
	};
}

export type DetachedFrameInput = {
	containerWidth: number;
	horizontalMargin: number;
	bottomOffset: number;
	/** The safe-area inset the card floats above. */
	bottomInset: number;
};

export type DetachedFrame = {
	left: number;
	width: number;
	/** How far above the container's bottom edge the card rests. */
	restingBottom: number;
};

/**
 * Where a detached card sits: inset by the margin on both sides, resting
 * `bottomOffset` above the safe-area inset. Closed is then
 * `translateY = containerHeight` — the card's top edge exactly at the
 * container's bottom, resting line included — because `closedHeight` is
 * `−restingBottom`.
 */
export function detachedFrame(input: DetachedFrameInput): DetachedFrame {
	"worklet";
	const margin = input.horizontalMargin > 0 ? input.horizontalMargin : 0;
	const width = input.containerWidth - margin * 2;
	const offset = input.bottomOffset > 0 ? input.bottomOffset : 0;
	const inset = input.bottomInset > 0 ? input.bottomInset : 0;
	return { left: margin, width: width > 0 ? width : 0, restingBottom: offset + inset };
}
