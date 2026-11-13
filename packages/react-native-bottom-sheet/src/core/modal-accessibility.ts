/** What the sheet's `Overlay` does to the app behind it: nothing written, a blocking scrim, or a scrim touches pass through. */
export type SheetOverlayKind = "none" | "blocking" | "touch-through";

export type ResolveSheetModalAccessibilityInput = {
	/** The sheet's open state — true from the open request until the close settles. */
	isOpen: boolean;
	/** The root's `modal` prop. A non-modal sheet leaves the app behind it reachable. */
	modal: boolean;
	/** An overlay that lets touches through leaves the app usable, so it makes the sheet non-modal. */
	overlay: SheetOverlayKind;
	/** The sheet is the top of its host. A sheet under another must not hold the screen reader. */
	isTop: boolean;
	/** The sheet can be closed by the user — `enablePanDownToClose`, and the current step's `dismissible`. */
	dismissible: boolean;
};

export type SheetModalAccessibility = {
	/** `accessibilityViewIsModal` for the panel. */
	isModal: boolean;
	/** The panel closes the sheet on the screen reader's escape gesture. */
	canEscape: boolean;
};

/**
 * Whether the panel is modal to a screen reader, and whether it answers the
 * escape gesture.
 *
 * Modal holds while the sheet is open, is modal at all (the `modal` prop, and no
 * touch-through overlay) and is the top sheet of
 * its host — two modal siblings leave which one wins to the order the platform
 * happens to have them in. Escape is the same condition and also needs a sheet
 * the user may dismiss: a sheet with `enablePanDownToClose` off, or on a step
 * with `dismissible: false`, is closed only by its own controls.
 */
export function resolveSheetModalAccessibility({
	isOpen,
	modal,
	overlay,
	isTop,
	dismissible,
}: ResolveSheetModalAccessibilityInput): SheetModalAccessibility {
	const isModal = isOpen && modal && overlay !== "touch-through" && isTop;
	return { isModal, canEscape: isModal && dismissible };
}

/**
 * The first candidate that is mounted, in the order given, or `null`: where
 * focus lands on open is the title, then the panel.
 */
export function firstFocusTarget<T>(candidates: readonly (T | null | undefined)[]): T | null {
	for (const candidate of candidates) {
		if (candidate !== null && candidate !== undefined) return candidate;
	}
	return null;
}
