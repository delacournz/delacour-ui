import type { ReactElement } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Text } from "../text";
import { TextClassProvider } from "../text/text.context";
import type { AnimatedBadgeFrame } from "./animated-badge.types";
import { type AnimatedBadgeSize, MEASURE_CANVAS_WIDTH, resolveAnimatedBadgeSlots } from "./animated-badge.variants";

export type AnimatedBadgeMeasureProps = {
	/** The incoming frame — the one the capsule is about to hold. */
	frame: AnimatedBadgeFrame;
	size: AnimatedBadgeSize;
	className: string | undefined;
	labelClassName: string | undefined;
	/** Receives the capsule's width for {@link frame}, border and padding included. */
	onMeasure: (width: number) => void;
};

/**
 * Lays out the incoming content, invisibly, so the capsule can spring to its
 * width before it arrives.
 *
 * A copy of the capsule — the root's own classes, the same row, the same label
 * on one line — on an absolutely positioned canvas wider than any label (see
 * `MEASURE_CANVAS_WIDTH`). The glyph is a box of the icon step rather than the
 * glyph itself: the footprint is all that is measured, and a spinner here would
 * spin for nobody.
 *
 * Hidden from assistive technology, transparent and untouchable — it exists for
 * its `onLayout` and nothing else.
 */
export function AnimatedBadgeMeasure({
	frame,
	size,
	className,
	labelClassName,
	onMeasure,
}: AnimatedBadgeMeasureProps): ReactElement {
	const slots = resolveAnimatedBadgeSlots({ status: frame.status, size, className, labelClassName });

	const handleLayout = (event: LayoutChangeEvent): void => {
		onMeasure(event.nativeEvent.layout.width);
	};

	return (
		<View
			accessibilityElementsHidden
			className="absolute top-0 left-0 opacity-0"
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={{ width: MEASURE_CANVAS_WIDTH }}
		>
			<TextClassProvider value={slots.label}>
				<View className={slots.root} onLayout={handleLayout}>
					<View className={slots.content}>
						{frame.glyph === "none" ? null : <View className={slots.icon} />}
						{frame.text === undefined ? (
							frame.label
						) : (
							<Text className={slots.label} numberOfLines={1}>
								{frame.text}
							</Text>
						)}
					</View>
				</View>
			</TextClassProvider>
		</View>
	);
}
AnimatedBadgeMeasure.displayName = "DelacourUI.AnimatedBadge.Measure";
