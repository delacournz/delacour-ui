import { useCallback, useRef } from "react";
import { type AnimationSource, CLOSED_INDEX } from "../core";
import type { AnimateListener, SettleListener } from "./animation.types";

export type UseSettleCallbacksOptions = {
	isOpen: boolean;
	setOpen: (open: boolean) => void;
	/** Unmounts the portal's children once a close has landed, unless the sheet is kept mounted. */
	setPresented: (presented: boolean) => void;
	/** The settled index and the detent count, for the handle's accessibility value. */
	setIndex: (index: number) => void;
	setDetentCount: (count: number) => void;
	onIndexChange: ((index: number, height: number, source: AnimationSource) => void) | undefined;
	onClose: (() => void) | undefined;
	onAnimate: AnimateListener | undefined;
};

/**
 * The JS-thread half of an animation: two listeners the UI thread schedules
 * through `scheduleOnRN`, stable for the sheet's lifetime so the worklets that
 * capture them never rebuild.
 *
 * Every prop they read goes through a ref. `scheduleOnRN` takes the function
 * it was handed at the time the worklet was built, so a listener that closed
 * over `onIndexChange` directly would call the callback from the render the
 * gesture began in.
 *
 * A settle at `-1` is the one place a physical close becomes state: `onClose`,
 * then `setOpen(false)` — which is `onOpenChange(false)` — then the portal
 * unmounts. A settle anywhere else reports through `onIndexChange` only when
 * the index actually moved.
 */
export function useSettleCallbacks(options: UseSettleCallbacksOptions): {
	onSettle: SettleListener;
	onAnimate: AnimateListener;
} {
	const latest = useRef(options);
	latest.current = options;
	const lastReported = useRef(CLOSED_INDEX);

	const onSettle = useCallback<SettleListener>((index, height, source, count) => {
		const current = latest.current;
		current.setIndex(index);
		current.setDetentCount(count);
		if (index !== lastReported.current) {
			lastReported.current = index;
			current.onIndexChange?.(index, height, source);
		}
		if (index !== CLOSED_INDEX) return;
		current.onClose?.();
		if (current.isOpen) current.setOpen(false);
		current.setPresented(false);
	}, []);

	const onAnimate = useCallback<AnimateListener>((fromIndex, toIndex, fromHeight, toHeight, source) => {
		latest.current.onAnimate?.(fromIndex, toIndex, fromHeight, toHeight, source);
	}, []);

	return { onSettle, onAnimate };
}
