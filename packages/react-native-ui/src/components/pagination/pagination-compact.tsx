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
 * The readout scales with the OS text size up to the library cap: its box
 * is a `min-h`, so a 2× readout grows the row rather than clipping.
 *
 * Internal — the root renders it for `variant="compact"`.
 */
export function PaginationCompact({ className, ...props }: PaginationCompactProps): ReactElement {
	const root = usePaginationPart("Pagination.Compact");
	const { accessibilityLabel, count, isDisabled, labels, page, select, size } = root;
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
			accessibilityValue={{ max: count, min: 1, now: page, text: formatCompactAccessibilityValue(page, count, labels) }}
			accessible
			className={slots.compact({ className })}
			onAccessibilityAction={handleAccessibilityAction}
			{...props}
		>
			<Text className={slots.compactLabel()}>{formatCompact(page, count)}</Text>
		</View>
	);
}
PaginationCompact.displayName = "DelacourUI.Pagination.Compact";
