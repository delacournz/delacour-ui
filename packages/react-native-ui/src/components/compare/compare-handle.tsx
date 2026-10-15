import { type ReactElement, type ReactNode, useCallback } from "react";
import { type AccessibilityActionEvent, View } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";
import { IconChevronGrabberHorizontal, IconChevronGrabberVertical } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { useComparePart } from "./compare.context";
import {
	COMPARE_GRAB_SCALE,
	COMPARE_GRIP_ICON_SIZE,
	COMPARE_HANDLE_BAND,
	COMPARE_HANDLE_SPRING,
	resolveCompareHandleClasses,
	resolveCompareValueText,
	resolveRevealTransforms,
} from "./compare.variants";

export type CompareHandleProps = {
	/** Merged onto the capsule. */
	className?: string;
	/** Replaces the default grip glyph inside the capsule. */
	children?: ReactNode;
	testID?: string;
};

/**
 * The seam: a divider the full length of the frame, a capsule on it, and the whole
 * accessibility surface.
 *
 * **It holds no gesture of its own.** The pan lives on the root, which is what
 * lets `grab="anywhere"` claim a touch nowhere near the handle and lets
 * `grab="handle"` fail a touch beside it so the scroll view underneath gets it.
 * A gesture here would nest a second recogniser inside the first.
 *
 * **One node carries the position, another the scale.** The band is translated
 * to the seam; the capsule inside it grows on grab. Two animated styles on one
 * node fight for `transform`, and the later one silently wins.
 *
 * **It is `adjustable`, and nothing else in the frame is.** Putting the role on
 * the frame would swallow the layers, which are content a reader may want to
 * reach one by one. The value text reads the Before layer's share — the number
 * the seam draws — and the increment and decrement actions are the only path to
 * the position for anyone not using a finger.
 */
export function CompareHandle({ className, children, testID }: CompareHandleProps): ReactElement {
	const {
		position,
		frameSize,
		grabbed,
		orientation,
		isRtl,
		color,
		size,
		isDisabled,
		isCalm,
		current,
		accessibilityLabel,
		labels,
		stepBy,
	} = useComparePart("Compare.Handle");
	const isVertical = orientation === "vertical";
	const classes = resolveCompareHandleClasses({ color, size, orientation, isDisabled });

	const bandStyle = useAnimatedStyle(() => {
		const measured = frameSize.value;
		const { handleOffset } = resolveRevealTransforms(position.value, measured, orientation, isRtl);
		const offset = handleOffset - COMPARE_HANDLE_BAND / 2;
		return {
			opacity: measured > 0 ? 1 : 0,
			transform: isVertical ? [{ translateY: offset }] : [{ translateX: offset }],
		};
	});

	// Derived, so the spring is evaluated when the grab changes rather than on
	// every frame of the drag. Calm motion holds the capsule at rest.
	const scale = useDerivedValue(() => {
		if (isCalm) return COMPARE_GRAB_SCALE.rest;
		return withSpring(
			grabbed.value === 1 ? COMPARE_GRAB_SCALE.grabbed : COMPARE_GRAB_SCALE.rest,
			COMPARE_HANDLE_SPRING
		);
	});
	const capsuleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled) return;
			stepBy(event.nativeEvent.actionName === "increment" ? 1 : -1);
		},
		[isDisabled, stepBy]
	);

	return (
		<Animated.View
			accessibilityActions={ACCESSIBILITY_ACTIONS}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="adjustable"
			accessibilityState={{ disabled: isDisabled }}
			accessibilityValue={{
				max: 100,
				min: 0,
				now: Math.round(current * 100),
				text: resolveCompareValueText(current, labels),
			}}
			accessible
			className={classes.handle}
			onAccessibilityAction={handleAccessibilityAction}
			style={[bandStyle, isVertical ? BAND_HEIGHT : BAND_WIDTH]}
			testID={testID}
		>
			<View className={classes.divider} />
			<Animated.View className={cn(classes.capsule, className)} style={capsuleStyle}>
				{children ?? (
					<Icon
						color={classes.glyphColor}
						icon={isVertical ? IconChevronGrabberVertical : IconChevronGrabberHorizontal}
						size={COMPARE_GRIP_ICON_SIZE[size]}
					/>
				)}
			</Animated.View>
		</Animated.View>
	);
}
CompareHandle.displayName = "DelacourUI.Compare.Handle";

/**
 * The two actions an assistive swipe on an `adjustable` maps to. Module scope so
 * the prop is stable across commits.
 */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;

/**
 * The band's extent along the axis, as a style rather than a class: it is
 * {@link COMPARE_HANDLE_BAND}, the number the pan's grab test reads, so the two
 * cannot disagree. The padding classes inside it sum to the same 44 by test.
 */
const BAND_WIDTH = { width: COMPARE_HANDLE_BAND } as const;
const BAND_HEIGHT = { height: COMPARE_HANDLE_BAND } as const;
