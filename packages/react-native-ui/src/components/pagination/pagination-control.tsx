import { type ReactElement, useCallback, useMemo } from "react";
import { I18nManager } from "react-native";
import { IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { usePaginationPart } from "./pagination.context";
import type { PaginationTargetProps } from "./pagination.types";
import {
	PAGINATION_HIT_SLOP,
	type PaginationDirection,
	paginationVariants,
	resolveControlForeground,
	resolveControlGlyph,
} from "./pagination.variants";

export type PaginationControlProps = PaginationTargetProps & {
	/** Shows "Previous" / "Next" beside the chevron. Defaults to true under the `simple` variant. */
	hasLabel?: boolean;
};

const ACCESSIBILITY_LABEL: Record<PaginationDirection, string> = {
	next: "Next page",
	previous: "Previous page",
};

const VISIBLE_LABEL: Record<PaginationDirection, string> = {
	next: "Next",
	previous: "Previous",
};

/**
 * The arrow either side of the run — what `Pagination.Previous` and
 * `Pagination.Next` both render.
 *
 * **Disabled at its end**, and announced so: there is no page before the first.
 * A disabled root disables both.
 *
 * **The chevron mirrors under a right-to-left layout.** The row itself flips, so
 * Previous already sits on the right; the glyph has to point that way too.
 *
 * Internal — the two named parts are the API.
 */
export function PaginationControl({
	direction,
	hasLabel,
	className,
	disabled,
	feedback = "fade",
	haptic,
	hitSlop,
	onPress,
	...props
}: PaginationControlProps & { direction: PaginationDirection }): ReactElement {
	const root = usePaginationPart(direction === "previous" ? "Pagination.Previous" : "Pagination.Next");
	const canMove = direction === "previous" ? root.canPrevious : root.canNext;
	const isDisabled = root.isDisabled || disabled === true || !canMove;
	const showLabel = hasLabel ?? root.variant === "simple";
	const slots = paginationVariants({ hasLabel: showLabel, isDisabled, size: root.size });

	const glyphClass = slots.glyph();
	const iconDefaults = useMemo(() => ({ className: glyphClass, color: resolveControlForeground() }), [glyphClass]);
	const icon = resolveControlGlyph(direction, I18nManager.isRTL) === "left" ? IconChevronLeft : IconChevronRight;

	const { page, select } = root;
	const handlePress = useCallback(() => {
		select(direction === "previous" ? page - 1 : page + 1);
		onPress?.();
	}, [direction, onPress, page, select]);

	const label = showLabel ? <Text className={slots.controlLabel()}>{VISIBLE_LABEL[direction]}</Text> : null;

	return (
		<Pressable
			accessibilityLabel={ACCESSIBILITY_LABEL[direction]}
			className={slots.control({ className })}
			disabled={isDisabled}
			feedback={feedback}
			haptic={haptic ?? root.haptic}
			hitSlop={hitSlop ?? (PAGINATION_HIT_SLOP[root.size] || undefined)}
			onPress={handlePress}
			{...props}
		>
			<IconDefaultsProvider value={iconDefaults}>
				{direction === "next" ? label : null}
				<Icon icon={icon} />
				{direction === "previous" ? label : null}
			</IconDefaultsProvider>
		</Pressable>
	);
}
PaginationControl.displayName = "DelacourUI.Pagination.Control";
