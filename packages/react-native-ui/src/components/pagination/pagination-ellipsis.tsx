import { type ReactElement, useCallback } from "react";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { usePaginationHitSlop, usePaginationPart } from "./pagination.context";
import type { PaginationTargetProps } from "./pagination.types";
import { formatEllipsisLabel, paginationVariants, resolveEllipsisTarget } from "./pagination.variants";

export type PaginationEllipsisProps = PaginationTargetProps & {
	/** Which way the gap jumps: `-1` back, `1` forward. */
	direction: -1 | 1;
};

/**
 * A gap in the run — and a target, not a decoration. Pressing it jumps
 * `pageJump` pages the way it points, clamped to the ends, which is the quickest
 * way across a long count on a screen with no room to type a number.
 *
 * Announced "Jump forward 5 pages" rather than "…", which names nothing.
 */
export function PaginationEllipsis({
	direction,
	className,
	disabled,
	feedback = "fade",
	haptic,
	hitSlop,
	onPress,
	...props
}: PaginationEllipsisProps): ReactElement {
	const root = usePaginationPart("Pagination.Ellipsis");
	const minimumHitSlop = usePaginationHitSlop(root.size);
	const isDisabled = root.isDisabled || disabled === true;
	const slots = paginationVariants({ isDisabled, size: root.size });

	const { count, page, pageJump, select } = root;
	const handlePress = useCallback(() => {
		select(resolveEllipsisTarget(page, direction, pageJump, count));
		onPress?.();
	}, [count, direction, onPress, page, pageJump, select]);

	return (
		<Pressable
			accessibilityLabel={formatEllipsisLabel(direction, pageJump, root.labels)}
			className={slots.ellipsis({ className })}
			disabled={isDisabled}
			feedback={feedback}
			haptic={haptic ?? root.haptic}
			hitSlop={hitSlop ?? minimumHitSlop}
			onPress={handlePress}
			{...props}
		>
			<Text className={slots.ellipsisLabel()}>…</Text>
		</Pressable>
	);
}
PaginationEllipsis.displayName = "DelacourUI.Pagination.Ellipsis";
