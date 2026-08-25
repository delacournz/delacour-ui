import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { BottomSheetPortalProvider } from "./bottom-sheet.context";
import { BottomSheetOverlay } from "./bottom-sheet-overlay";

export type BottomSheetPortalProps = {
	children?: ReactNode;
};

/**
 * Everything that draws above the app once the sheet is open.
 *
 * It renders no view of its own, and it does not portal anything either —
 * `BottomSheetModal` already hosts itself in the `BottomSheetModalProvider` that
 * `DelacourProvider` mounts innermost. What this part does is one thing:
 * **it lifts the `BottomSheet.Overlay` out of its own children** and publishes it
 * on context, so `BottomSheet.Container` can clone it into gorhom's
 * `backdropComponent` slot.
 *
 * That indirection buys the anatomy. The scrim and the sheet are siblings on
 * screen, so they read best as siblings in the tree — but gorhom takes the scrim
 * as a render prop, and a component cannot hand a prop to a sibling. This is the
 * seam where the two shapes are reconciled, and it is why the part exists at all
 * rather than the container simply taking a `backdrop` prop.
 *
 * @example
 * <BottomSheet.Portal>
 *   <BottomSheet.Overlay />
 *   <BottomSheet.Container>{…}</BottomSheet.Container>
 * </BottomSheet.Portal>
 */
export function BottomSheetPortal({ children }: BottomSheetPortalProps): ReactElement {
	const { content, overlay } = useMemo(() => hoistOverlay(children), [children]);
	const value = useMemo(() => ({ overlay }), [overlay]);

	return <BottomSheetPortalProvider value={value}>{content}</BottomSheetPortalProvider>;
}
BottomSheetPortal.displayName = "DelacourUI.BottomSheet.Portal";

/**
 * Splits a portal's children into the scrim and everything else.
 *
 * Lives here rather than with the parts: it is the portal that lifts its own
 * children, and importing it from `bottom-sheet-overlay.tsx` would close a cycle.
 * The same rule that keeps `withIndicator` in `radio.tsx`. See AGENTS.md.
 *
 * A second overlay is dropped rather than rendered — there is one
 * `backdropComponent` slot to clone into, and silently drawing two scrims at
 * different opacities is worse than the warning.
 */
function hoistOverlay(children: ReactNode): { content: ReactNode; overlay: ReactElement | null } {
	const items = Children.toArray(children);
	const content: ReactNode[] = [];
	let overlay: ReactElement | null = null;
	let seen = 0;

	for (const child of items) {
		if (isValidElement(child) && child.type === BottomSheetOverlay) {
			seen += 1;
			overlay ??= child;
			continue;
		}
		content.push(child);
	}

	if (process.env.NODE_ENV !== "production" && seen > 1) {
		console.warn(
			`BottomSheet.Portal: ${seen} <BottomSheet.Overlay> elements were written; only the first is drawn. A sheet has one backdrop.`
		);
	}

	return { content, overlay };
}
