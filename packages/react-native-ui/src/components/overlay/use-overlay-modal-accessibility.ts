import {
	type ModalAccessibility,
	type UseModalAccessibilityOptions,
	useModalAccessibility,
} from "../../hooks/use-modal-accessibility";
import { useOptionalOverlay } from "./overlay.context";
import { isModalOnTop } from "./overlay-registry";

export type UseOverlayModalAccessibilityOptions = Omit<UseModalAccessibilityOptions, "isOnTop"> & {
	/** The id passed to `Overlay.Portal`. */
	id: string;
};

export type OverlayModalAccessibility = ModalAccessibility & {
	/** Whether this overlay is the one a screen reader is held inside. */
	isOnTop: boolean;
};

/**
 * `useModalAccessibility` for an overlay drawn through `Overlay.Portal`.
 *
 * Reads `isOnTop` from the registry with `isModalOnTop`: the container holds
 * VoiceOver and takes the escape scrub only while it is the top `modal` or
 * `anchored` overlay that is not exiting — so a dialog lets go while a popover
 * opened from it is up. Pass `focusInitial` and `restoreFocus` to
 * `useOverlayPresence`'s `onEntered` and `onExited`.
 *
 * @example
 * const modal = useOverlayModalAccessibility({ id, isOpen, initialFocus: [titleRef], returnFocus: triggerRef, onEscape: close });
 * const presence = useOverlayPresence({ isOpen, onEntered: modal.focusInitial, onExited: modal.restoreFocus });
 * <Animated.View {...modal.containerProps} role="dialog">…</Animated.View>
 */
export function useOverlayModalAccessibility({
	id,
	...options
}: UseOverlayModalAccessibilityOptions): OverlayModalAccessibility {
	const registry = useOptionalOverlay();
	const isOnTop = isModalOnTop(registry?.state ?? null, id);
	return { ...useModalAccessibility({ ...options, isOnTop }), isOnTop };
}
