import { type OverlayRegistryState, topOverlay } from "./overlay-registry";

/**
 * Anything a screen reader's focus can be moved to: a mounted host view, as a
 * `ref` hands it over. Typed loosely so a part can hold a `Text`, a `View` or
 * an `Animated.View` behind one ref type without importing React Native.
 */
export type ModalFocusTarget = object;

/** The props that make a modal container modal to assistive technology. */
export type ModalContainerAccessibility = {
	/** VoiceOver stays inside the container while true. */
	accessibilityViewIsModal: boolean;
	/** VoiceOver's two-finger "Z" scrub. Unset when nothing should close the container. */
	onAccessibilityEscape: (() => void) | undefined;
};

/**
 * The first candidate that is mounted, in the order given, or `null`.
 *
 * A modal lists where focus should land on open — its title, then its first
 * item, then the container itself — and takes the first one that exists.
 */
export function firstFocusTarget<T>(candidates: readonly (T | null | undefined)[]): T | null {
	for (const candidate of candidates) {
		if (candidate !== null && candidate !== undefined) return candidate;
	}
	return null;
}

/**
 * Whether the overlay `id` is the one a screen reader should be held inside.
 *
 * True for the top `modal` or `anchored` overlay that is not animating closed:
 * a menu opened from a dialog holds focus, and the dialog under it does not
 * until the menu starts to exit. A toast never does.
 *
 * True as well when there is nothing to compare against — no `OverlayProvider`,
 * no `id`, or an id the registry has not recorded yet (a container drawn
 * without `Overlay.Portal`, or the first render before the portal registers).
 * Such a container is its own top.
 */
export function isModalOnTop(state: OverlayRegistryState | null, id: string | undefined): boolean {
	if (state === null || id === undefined) return true;
	const entry = state.open.find((candidate) => candidate.id === id);
	if (entry === undefined) return true;
	if (entry.isExiting) return false;
	const live: OverlayRegistryState = { ...state, open: state.open.filter((candidate) => !candidate.isExiting) };
	return topOverlay(live) === id;
}

export type ResolveModalContainerAccessibilityInput = {
	/** The container is open and not animating closed. */
	isOpen: boolean;
	/** `isModalOnTop` for this container. */
	isOnTop: boolean;
	/** Closes the container. Omit it for one only its own actions may close. */
	onEscape?: () => void;
};

/**
 * `accessibilityViewIsModal` and `onAccessibilityEscape` for a modal container.
 *
 * Both hold only while the container is open and on top. A container under
 * another must not hold VoiceOver — two modal siblings leave which one wins to
 * the order UIKit happens to have them in — and a closing one must let focus go
 * back to its trigger.
 */
export function resolveModalContainerAccessibility({
	isOpen,
	isOnTop,
	onEscape,
}: ResolveModalContainerAccessibilityInput): ModalContainerAccessibility {
	const isActive = isOpen && isOnTop;
	return {
		accessibilityViewIsModal: isActive,
		onAccessibilityEscape: isActive ? onEscape : undefined,
	};
}
