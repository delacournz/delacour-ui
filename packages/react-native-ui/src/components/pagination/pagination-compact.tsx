import { type ReactElement, useCallback } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { Text } from "../text";
import { usePaginationPart } from "./pagination.context";
import { formatCompact, formatCompactAccessibilityValue, paginationVariants } from "./pagination.variants";

export type PaginationCompactProps = ViewProps & { className?: string };

/** The two actions an assistive swipe on an `adjustable` maps to. */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;

/**
 * The `compact` variant's "3 / 12" readout.
 *
 * **One adjustable element.** VoiceOver reads "Pagination, Page 3 of 12,
 * adjustable", and a swipe up or down moves a page — so the whole control is
 * usable from this one stop, without hunting for the arrows either side.
 *
 * The readout does not scale with the OS text size: it shares a row with
 * fixed-size targets, and the page it shows is already in the accessibility
 * value.
 *
 * Internal — the root renders it for `variant="compact"`.
 */
export function PaginationCompact({ className, ...props }: PaginationCompactProps): ReactElement {
	const root = usePaginationPart("Pagination.Compact");
	const { accessibilityLabel, count, isDisabled, page, select, size } = root;
	const slots = paginationVariants({ isDisabled, size });

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
			select(page + delta);
		},
		[page, select]
	);

	return (
		<View
			accessibilityActions={isDisabled ? undefined : ACCESSIBILITY_ACTIONS}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="adjustable"
			accessibilityState={{ disabled: isDisabled }}
			accessibilityValue={{ max: count, min: 1, now: page, text: formatCompactAccessibilityValue(page, count) }}
			accessible
			className={slots.compact({ className })}
			onAccessibilityAction={handleAccessibilityAction}
			{...props}
		>
			<Text allowFontScaling={false} className={slots.compactLabel()}>
				{formatCompact(page, count)}
			</Text>
		</View>
	);
}
PaginationCompact.displayName = "DelacourUI.Pagination.Compact";
