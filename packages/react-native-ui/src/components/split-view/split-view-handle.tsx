import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useSplitViewPart } from "./split-view.context";
import type { SplitViewSlotProps } from "./split-view.types";
import { splitViewVariants } from "./split-view.variants";

export type SplitViewHandleProps = Omit<ViewProps, "children" | "style"> & SplitViewSlotProps;

/**
 * The grip capsule drawn in the drag row.
 *
 * Chrome only: the touch target is the whole 44pt row around it, so the
 * capsule takes no touches of its own and is hidden from assistive technology —
 * the row is the adjustable element. It darkens while a finger is on the row
 * and fades when the view is disabled.
 */
export function SplitViewHandle({ className, ...props }: SplitViewHandleProps): ReactElement {
	const { variant, isActive, isDisabled } = useSplitViewPart("SplitView.Handle");
	return (
		<View
			accessibilityElementsHidden
			className={splitViewVariants({ isActive, isDisabled, variant }).handle({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			{...props}
		/>
	);
}
SplitViewHandle.displayName = "DelacourUI.SplitView.Handle";
