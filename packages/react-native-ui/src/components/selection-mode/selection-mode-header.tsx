import { type ReactElement, useEffect } from "react";
import { AccessibilityInfo, Platform, type ViewProps } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import { IconCrossMedium } from "../../icons/central";
import { Button } from "../button";
import { Icon } from "../icon";
import { Text } from "../text";
import { useSelectionModePart } from "./selection-mode.context";
import { resolveHeaderCount, SELECTION_MODE_MOTION, selectionModeVariants } from "./selection-mode.variants";

export type SelectionModeHeaderProps = ViewProps & {
	/** Leads the count when the root knows its `values`. Default `"Select"`. */
	title?: string;
	/** Drop the select-all control. It is also dropped when the root has no `values` to pick from. */
	isSelectAllHidden?: boolean;
	/** `testID` for the close control, so a test or automation can leave the mode. */
	closeTestID?: string;
	/** `testID` for the select-all control. */
	selectAllTestID?: string;
	className?: string;
};

const ENTERING = FadeInDown.duration(SELECTION_MODE_MOTION.fadeMs).withInitialValues({
	opacity: 0,
	transform: [{ translateY: -SELECTION_MODE_MOTION.headerTravel }],
});
const EXITING = FadeOut.duration(SELECTION_MODE_MOTION.reducedFadeMs);
const REDUCED_ENTERING = FadeIn.duration(SELECTION_MODE_MOTION.reducedFadeMs).reduceMotion(ReduceMotion.Never);
const REDUCED_EXITING = FadeOut.duration(SELECTION_MODE_MOTION.reducedFadeMs).reduceMotion(ReduceMotion.Never);

/**
 * Says the mode is on and offers the way out.
 *
 * Renders only while the mode is on: a close button that exits, the count —
 * `"{title} · n of m"`, or `"n selected"` when the root has no `values` — and
 * select-all, which turns into "Deselect all" once there is nothing left to add.
 * It fades in from 8pt above; under reduced motion it only fades.
 *
 * The count is announced as it changes: a polite live region on Android, an
 * announcement on iOS, which has no live regions.
 */
export function SelectionModeHeader({
	title = "Select",
	isSelectAllHidden = false,
	closeTestID,
	selectAllTestID,
	className,
	...props
}: SelectionModeHeaderProps): ReactElement | null {
	const { isActive, count, total, isAllSelected, exit, selectAll, clear } =
		useSelectionModePart("SelectionMode.Header");
	const isReducedMotion = useReducedMotion();
	const label = resolveHeaderCount({ count, title, total });
	const slots = selectionModeVariants();

	useEffect(() => {
		if (isActive && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(label);
	}, [isActive, label]);

	if (!isActive) return null;

	const hasSelectAll = !isSelectAllHidden && total !== undefined && total > 0;

	return (
		<Animated.View
			className={slots.header({ className })}
			entering={isReducedMotion ? REDUCED_ENTERING : ENTERING}
			exiting={isReducedMotion ? REDUCED_EXITING : EXITING}
			{...props}
		>
			<Button accessibilityLabel="Stop selecting" onPress={exit} size="icon-md" testID={closeTestID} variant="ghost">
				<Icon icon={IconCrossMedium} />
			</Button>
			<Text accessibilityLiveRegion="polite" className={slots.headerTitle()} numberOfLines={1}>
				{label}
			</Text>
			{hasSelectAll ? (
				<Button onPress={isAllSelected ? clear : selectAll} size="sm" testID={selectAllTestID} variant="ghost">
					<Button.Label>{isAllSelected ? "Deselect all" : "Select all"}</Button.Label>
				</Button>
			) : null}
		</Animated.View>
	);
}
SelectionModeHeader.displayName = "DelacourUI.SelectionMode.Header";
