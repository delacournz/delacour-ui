import { type RefObject, useCallback, useMemo, useRef } from "react";
import { AccessibilityInfo, type HostInstance } from "react-native";
import {
	firstFocusTarget,
	isModalOnTop,
	type ModalContainerAccessibility,
	type ModalFocusTarget,
	resolveModalContainerAccessibility,
} from "./modal-accessibility";
import { useOptionalOverlay } from "./overlay.context";

export type UseModalAccessibilityOptions = {
	/**
	 * The owner's open state — not the exit animation's. The container stops
	 * holding VoiceOver the moment a close is asked for, so focus can go back to
	 * the trigger while the exit plays.
	 */
	isOpen: boolean;
	/**
	 * The id passed to `Overlay.Portal`, so a container under another overlay
	 * lets go. Omit it for a container not drawn through a portal.
	 */
	id?: string;
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
	/** Whether this container is the one a screen reader is held inside. */
	isOnTop: boolean;
	/** Moves focus to the first mounted `initialFocus`. Pass it as `useOverlayPresence`'s `onEntered`. */
	focusInitial: () => void;
	/** Moves focus back to `returnFocus`. Pass it as `useOverlayPresence`'s `onExited`. */
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
 *   while it is open and the top overlay, and wires the escape scrub to
 *   `onEscape`. On Android, `OverlayProvider` hides the app content and every
 *   overlay under the top modal — `importantForAccessibility` on those views —
 *   so TalkBack cannot leave it either; this hook adds nothing there.
 * - **Focus in.** `focusInitial` moves focus to the title, or the first item,
 *   once the container has entered. Call it from `onEntered`, not on mount: a
 *   view still fading in may not be focusable yet.
 * - **Focus out.** `restoreFocus` moves it back to the trigger once the
 *   container has gone. Call it from `onExited`.
 *
 * The refs are read when the callbacks run, so a part that mounts after the
 * container — a title rendered by a child — is still found. Both callbacks are
 * stable for the life of the component.
 *
 * @example
 * const modal = useModalAccessibility({ id, isOpen, initialFocus: [titleRef], returnFocus: triggerRef, onEscape: close });
 * const presence = useOverlayPresence({ isOpen, onEntered: modal.focusInitial, onExited: modal.restoreFocus });
 * <Animated.View {...modal.containerProps} role="dialog">…</Animated.View>
 */
export function useModalAccessibility({
	isOpen,
	id,
	initialFocus,
	returnFocus,
	onEscape,
}: UseModalAccessibilityOptions): ModalAccessibility {
	const registry = useOptionalOverlay();
	const isOnTop = isModalOnTop(registry?.state ?? null, id);

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

	return { containerProps, isOnTop, focusInitial, restoreFocus };
}
