import { type ReactElement, useCallback, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { usePaginationPart } from "./pagination.context";
import type { PaginationTargetProps } from "./pagination.types";
import {
	formatPageLabel,
	PAGINATION_FILL_DURATION_MS,
	PAGINATION_HIT_SLOP,
	paginationVariants,
} from "./pagination.variants";

export type PaginationItemProps = PaginationTargetProps & {
	/** The page this item moves to, one-based. */
	page: number;
	/** Merged onto the number's `Text`. */
	labelClassName?: string;
};

/**
 * One page number. Pressing it moves the pagination there; the current page is
 * filled `primary` and announced `selected`.
 *
 * **The fill is its own layer and cross-fades** over 150ms while the number's
 * colour changes outright. `withTiming` keeps Reanimated's `System` reduce-motion
 * policy, so with the setting on the fill snaps. It is seeded at its settled
 * value, so an item that mounts current — the window sliding a new page in — is
 * drawn filled rather than fading up from nothing.
 *
 * An `sm` item draws at 36pt and carries 4pt of `hitSlop` to reach 44.
 */
export function PaginationItem({
	page,
	labelClassName,
	className,
	disabled,
	feedback = "fade",
	haptic,
	hitSlop,
	onPress,
	accessibilityState,
	...props
}: PaginationItemProps): ReactElement {
	const root = usePaginationPart("Pagination.Item");
	const isCurrent = page === root.page;
	const isDisabled = root.isDisabled || disabled === true;
	const slots = paginationVariants({ isCurrent, isDisabled, size: root.size });

	const fill = useSharedValue(isCurrent ? 1 : 0);
	useEffect(() => {
		fill.value = withTiming(isCurrent ? 1 : 0, { duration: PAGINATION_FILL_DURATION_MS });
	}, [fill, isCurrent]);
	const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

	const { select } = root;
	const handlePress = useCallback(() => {
		select(page);
		onPress?.();
	}, [onPress, page, select]);

	return (
		<Pressable
			accessibilityLabel={formatPageLabel(page)}
			accessibilityState={{ ...accessibilityState, selected: isCurrent }}
			className={slots.item({ className })}
			disabled={isDisabled}
			feedback={feedback}
			haptic={haptic ?? root.haptic}
			hitSlop={hitSlop ?? (PAGINATION_HIT_SLOP[root.size] || undefined)}
			onPress={handlePress}
			{...props}
		>
			<Animated.View className={slots.fill()} pointerEvents="none" style={fillStyle} />
			<Text className={slots.itemLabel({ className: labelClassName })}>{page}</Text>
		</Pressable>
	);
}
PaginationItem.displayName = "DelacourUI.Pagination.Item";
