import { type ReactElement, type ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Text } from "../text";
import { useComparePart } from "./compare.context";
import {
	type CompareLabelPlacement,
	compareVariants,
	resolveCompareLabelClass,
	resolveCompareLabelOpacity,
} from "./compare.variants";

type CompareLabelBaseProps = {
	/** Along the cross axis — the top or bottom of a horizontal frame. Default `start`. */
	placement?: CompareLabelPlacement;
	className?: string;
	/** A plain string also names that side in the handle's value text. */
	children: ReactNode;
};

/** Which side the label names. Discriminated so a side is always stated, never inferred from order. */
export type CompareLabelProps =
	| (CompareLabelBaseProps & { side: "before" })
	| (CompareLabelBaseProps & { side: "after" });

/**
 * A caption pinned to one side, fading out as the seam covers that side.
 *
 * **Hidden from assistive technology on purpose.** A plain-string child is
 * registered with the root instead, and the handle's value text speaks it —
 * "50 percent Original" — so a reader hears the name once, attached to the
 * number, rather than twice from two unrelated elements.
 */
export function CompareLabel({ side, placement = "start", className, children }: CompareLabelProps): ReactElement {
	const { position, orientation, isRtl, registerLabel } = useComparePart("Compare.Label");
	const text = typeof children === "string" ? children : null;

	useEffect(() => {
		registerLabel(side, text);
		return () => registerLabel(side, null);
	}, [registerLabel, side, text]);

	const style = useAnimatedStyle(() => ({ opacity: resolveCompareLabelOpacity(side, position.value) }));
	const edges = resolveCompareLabelClass({ side, placement, orientation, isRtl });

	return (
		<Animated.View
			accessibilityElementsHidden
			accessible={false}
			className={compareVariants().label({ className: [edges, className] })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={style}
		>
			<Text.Label size="sm">{children}</Text.Label>
		</Animated.View>
	);
}
CompareLabel.displayName = "DelacourUI.Compare.Label";
