import { type RefObject, useCallback, useEffect, useRef } from "react";
import { AccessibilityInfo, type HostInstance, Platform, type ViewInstance } from "react-native";
import {
	firstFocusTarget,
	resolveSheetModalAccessibility,
	type SheetModalAccessibility,
	type SheetOverlayKind,
} from "../core";

/**
 * How long after the close settles Android waits before focus goes back to the trigger.
 *
 * The settle also unmounts the sheet, and a skin hides the app behind a modal sheet with
 * `importantForAccessibility="no-hide-descendants"` until that unmount commits and the
 * un-hide reaches the native tree. Focus sent in the settle's own commit targets a trigger
 * TalkBack still cannot see, so it lands on whatever it picks instead.
 */
export const ANDROID_RESTORE_FOCUS_DELAY_MS = 120;

/** A mounted host view, as a `ref` hands it over — a `View`, a `Text`, a `Pressable`. */
export type SheetFocusTarget = ViewInstance;

export type SheetAccessibilityRefs = {
	/** The `Title`'s node: where focus lands on open. */
	title: RefObject<SheetFocusTarget | null>;
	/** The panel's node: where focus lands when there is no title. */
	container: RefObject<SheetFocusTarget | null>;
	/** The `Trigger`'s node: where focus goes back to on close. */
	trigger: RefObject<SheetFocusTarget | null>;
};

export type UseSheetAccessibilityOptions = {
	/** The sheet's open state. */
	isOpen: boolean;
	/** The settled snap index: `-1` closed, `0` and up open. Focus moves on its transitions. */
	index: number;
	modal: boolean;
	overlay: SheetOverlayKind;
	isTop: boolean;
	dismissible: boolean;
	refs: SheetAccessibilityRefs;
};

/**
 * Moves VoiceOver / TalkBack focus to a mounted host view. A no-op for `null`.
 *
 * `sendAccessibilityEvent(…, "focus")` rather than `setAccessibilityFocus`,
 * which is deprecated and needs `findNodeHandle`.
 */
export function focusSheetTarget(target: SheetFocusTarget | null): void {
	if (target === null) return;
	AccessibilityInfo.sendAccessibilityEvent(target as HostInstance, "focus");
}

/**
 * What a modal sheet needs from assistive technology.
 *
 * - **Containment and escape.** The returned flags are `accessibilityViewIsModal`
 *   and whether the panel answers the escape gesture, resolved by core.
 * - **Focus in.** Once the sheet has settled open (the index leaves `-1`),
 *   focus goes to the title, else the panel.
 * - **Focus out.** Once the close has settled (the index returns to `-1`),
 *   focus goes back to the trigger — only if it is still mounted. On Android that
 *   waits `ANDROID_RESTORE_FOCUS_DELAY_MS`, so the app is visible again first; a
 *   re-open inside the wait cancels it.
 *
 * A non-modal sheet — `modal={false}` or a touch-through overlay — moves no focus:
 * a persistent drawer must not take it.
 */
export function useSheetAccessibility({
	isOpen,
	index,
	modal,
	overlay,
	isTop,
	dismissible,
	refs,
}: UseSheetAccessibilityOptions): SheetModalAccessibility {
	const previous = useRef(index);
	const resolved = resolveSheetModalAccessibility({ isOpen, modal, overlay, isTop, dismissible });
	const latest = useRef({ isModal: modal && overlay !== "touch-through", refs });
	latest.current = { isModal: modal && overlay !== "touch-through", refs };

	const focusInitial = useCallback(() => {
		const { title, container } = latest.current.refs;
		focusSheetTarget(firstFocusTarget([title.current, container.current]));
	}, []);

	const restoreFocus = useCallback(() => {
		focusSheetTarget(latest.current.refs.trigger.current);
	}, []);

	useEffect(() => {
		const before = previous.current;
		previous.current = index;
		if (!latest.current.isModal) return undefined;
		if (before < 0 && index >= 0) {
			focusInitial();
			return undefined;
		}
		if (before < 0 || index >= 0) return undefined;
		if (Platform.OS !== "android") {
			restoreFocus();
			return undefined;
		}
		const timer = setTimeout(restoreFocus, ANDROID_RESTORE_FOCUS_DELAY_MS);
		return () => clearTimeout(timer);
	}, [index, focusInitial, restoreFocus]);

	return resolved;
}
