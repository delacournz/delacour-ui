import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { type HostInstance, useWindowDimensions } from "react-native";
import type { AnchorRect } from "./popover.position";

/** A native view that can report its frame — what an anchor ref points at. */
export type MeasurableNode = HostInstance;

export type UseAnchorMeasureOptions = {
	/** Measure while true: on the transition to true, and again on every window-size change. */
	isEnabled: boolean;
};

export type AnchorMeasure = {
	/** A callback ref for the view to measure. */
	ref: (node: MeasurableNode | null) => void;
	/** The node the ref last received. */
	node: RefObject<MeasurableNode | null>;
	/** The view's frame in window coordinates; `null` from each enable until the measure lands. */
	rect: AnchorRect | null;
	/** Measure again now. */
	measure: () => void;
};

/**
 * Measures a view in **window** coordinates, which is what makes an anchored
 * panel land on its anchor wherever the anchor is — inside a `ScrollView`, a
 * bottom sheet or under a navigator header — because the panel is teleported to
 * a host that fills the window.
 *
 * `rect` is cleared on each enable, so a panel re-opened after the anchor moved
 * never paints one frame at the old position, and kept while disabled, so a
 * panel animating closed still has somewhere to be. A window-size change while
 * enabled — a rotation — measures again without clearing.
 *
 * **A leaf.** Tooltip imports it; it imports nothing from `./popover` or
 * `./index`.
 */
export function useAnchorMeasure({ isEnabled }: UseAnchorMeasureOptions): AnchorMeasure {
	const node = useRef<MeasurableNode | null>(null);
	const [rect, setRect] = useState<AnchorRect | null>(null);
	const { width, height } = useWindowDimensions();

	const ref = useCallback((next: MeasurableNode | null) => {
		node.current = next;
	}, []);

	const measure = useCallback(() => {
		node.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
			setRect((previous) =>
				previous !== null &&
				previous.x === x &&
				previous.y === y &&
				previous.width === measuredWidth &&
				previous.height === measuredHeight
					? previous
					: { x, y, width: measuredWidth, height: measuredHeight }
			);
		});
	}, []);

	useEffect(() => {
		if (!isEnabled) return;
		setRect(null);
		measure();
	}, [isEnabled, measure]);

	useEffect(() => {
		if (!isEnabled || width === 0 || height === 0) return;
		// A frame later: the window reports its new size before the anchor has
		// been laid out at it, and a measure now would read the old frame.
		const frame = requestAnimationFrame(measure);
		return () => cancelAnimationFrame(frame);
	}, [isEnabled, measure, width, height]);

	return { ref, node, rect, measure };
}
