import { type RefObject, useCallback, useMemo, useRef } from "react";
import { AccessibilityInfo, type HostInstance } from "react-native";
import {
	firstFocusTarget,
	type ModalContainerAccessibility,
	type ModalFocusTarget,
	resolveModalContainerAccessibility,
} from "../lib/modal-accessibility";

export type UseModalAccessibilityOptions = {
	/**
	 * The owner's open state — not the exit animation's. The container stops
	 * holding VoiceOver the moment a close is asked for, so focus can go back to
	 * the trigger while the exit plays.
	 */
	isOpen: boolean;
	/**
	 * Whether this container is the one a screen reader is held inside — false
	 * while another overlay is open over it. Default true. An overlay drawn
	 * through `Overlay.Portal` uses `useOverlayModalAccessibility`, which reads
	 * this from the overlay registry.
	 */
	isOnTop?: boolean;
	/**
	 * Where focus lands on open, best first — the title, then the first item,
	 * then the container. The first one mounted wins.
	 */
	initialFocus?: readonly RefObject<ModalFocusTarget | null>[];
	/** Where focus goes back to on close — the trigger. Nothing happens if it has unmounted. */
	returnFocus?: RefObject<ModalFocusTarget | null>;
	/** Closes the container from VoiceOver's escape scrub. Omit it when only the container's own actions close it. */
	onEscape?: () => void;
};

export type ModalAccessibility = {
	/** Spread onto the container: `accessibilityViewIsModal` and `onAccessibilityEscape`. */
	containerProps: ModalContainerAccessibility;
	/** Moves focus to the first mounted `initialFocus`. Call it once the container has entered. */
	focusInitial: () => void;
	/** Moves focus back to `returnFocus`. Call it once the container has gone. */
	restoreFocus: () => void;
};

/**
 * Moves VoiceOver / TalkBack focus to a mounted host view. A no-op for `null`.
 *
 * `sendAccessibilityEvent(…, "focus")` rather than `setAccessibilityFocus`,
 * which is deprecated and needs `findNodeHandle`.
 */
export function focusAccessibilityTarget(target: ModalFocusTarget | null): void {
	if (target === null) return;
	AccessibilityInfo.sendAccessibilityEvent(target as HostInstance, "focus");
}

/**
 * What every modal container needs from assistive technology, in one place.
 *
 * - **Containment.** `containerProps` makes the container modal to VoiceOver
 *   while it is open and on top, and wires the escape scrub to `onEscape`.
 *   TalkBack has no equivalent prop: a container drawn through
 *   `Overlay.Portal` is contained by `OverlayProvider`, one in a React Native
 *   `Modal` by its own window, and one drawn inline is not contained.
 * - **Focus in.** `focusInitial` moves focus to the title, or the first item.
 *   Call it once the container has entered, not on mount: a view still fading
 *   in may not be focusable yet.
 * - **Focus out.** `restoreFocus` moves it back to the trigger. Call it once
 *   the container has gone.
 *
 * The refs are read when the callbacks run, so a part that mounts after the
 * container — a title rendered by a child — is still found. Both callbacks are
 * stable for the life of the component, so passing them to an animation hook
 * never restarts a timing.
 *
 * Imports nothing from any component, so a container that never draws through
 * `Overlay` — a menu in a `Modal`, an inline panel — takes no dependency on it.
 *
 * @example
 * const modal = useModalAccessibility({ isOpen, initialFocus: [titleRef], returnFocus: triggerRef, onEscape: close });
 * <Animated.View {...modal.containerProps}>…</Animated.View>
 */
export function useModalAccessibility({
	isOpen,
	isOnTop = true,
	initialFocus,
	returnFocus,
	onEscape,
}: UseModalAccessibilityOptions): ModalAccessibility {
	const initialRef = useRef(initialFocus);
	initialRef.current = initialFocus;
	const returnRef = useRef(returnFocus);
	returnRef.current = returnFocus;

	const focusInitial = useCallback(() => {
		const candidates = (initialRef.current ?? []).map((ref) => ref.current);
		focusAccessibilityTarget(firstFocusTarget(candidates));
	}, []);

	const restoreFocus = useCallback(() => {
		focusAccessibilityTarget(returnRef.current?.current ?? null);
	}, []);

	const containerProps = useMemo(
		() => resolveModalContainerAccessibility({ isOpen, isOnTop, onEscape }),
		[isOpen, isOnTop, onEscape]
	);

	return { containerProps, focusInitial, restoreFocus };
}
