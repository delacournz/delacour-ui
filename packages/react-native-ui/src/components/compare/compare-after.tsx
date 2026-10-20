import type { ReactElement } from "react";
import { View } from "react-native";
import { useComparePart } from "./compare.context";
import type { CompareLayerProps } from "./compare.types";
import { compareVariants, resolveCoveredLayer } from "./compare.variants";

/**
 * The back layer: full frame, never moved.
 *
 * It sits at `z-0` whatever order the children come in, and leaves the
 * accessibility tree only while the seam covers it entirely — at that point it is
 * on screen in no pixel, and a focusable element nobody can see is a trap.
 */
export function CompareAfter({ className, children, testID }: CompareLayerProps): ReactElement {
	const { current } = useComparePart("Compare.After");
	const isCovered = resolveCoveredLayer(current) === "after";

	return (
		<View
			accessibilityElementsHidden={isCovered}
			className={compareVariants().layer({ className })}
			importantForAccessibility={isCovered ? "no-hide-descendants" : "auto"}
			testID={testID}
		>
			{children}
		</View>
	);
}
CompareAfter.displayName = "DelacourUI.Compare.After";
