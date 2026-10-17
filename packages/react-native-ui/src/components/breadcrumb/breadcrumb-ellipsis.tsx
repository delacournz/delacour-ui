import type { ReactElement } from "react";
import { View } from "react-native";
import { IconDotGrid1x3Horizontal } from "../../icons/central";
import { Icon } from "../icon";
import { type HapticFeedback, Pressable } from "../pressable";
import { useBreadcrumbPart } from "./breadcrumb.context";
import type { BreadcrumbSlotProps } from "./breadcrumb.types";
import { BREADCRUMB_LINK_HIT_SLOP, breadcrumbVariants, resolveBreadcrumbEllipsisLabel } from "./breadcrumb.variants";
import { BreadcrumbGlyph } from "./breadcrumb-glyph";

export type BreadcrumbEllipsisProps = BreadcrumbSlotProps & {
	/** How many levels this stands for. Names the control for a screen reader. */
	hiddenCount?: number;
	/** Makes the ellipsis a button. Without it, it is a static mark. */
	onPress?: () => void;
	/** Haptic played on press-in. Off by default. */
	haptic?: false | HapticFeedback;
};

/**
 * Three dots standing in for the levels a collapsed trail hides.
 *
 * `Breadcrumb.List` places one itself when it collapses, wired to its
 * `onEllipsisPress`; write one by hand only for a custom layout.
 *
 * A `Pressable` announced "Show 3 hidden levels" when it has an `onPress`, and a
 * plain view announced "3 hidden levels" when it does not — a static mark
 * rendered as a button would be a control that does nothing. Its box is held to
 * the label's line height, so the links' slop lifts it to 44 points too.
 */
export function BreadcrumbEllipsis({
	className,
	children,
	hiddenCount,
	onPress,
	haptic,
	accessibilityLabel,
	...props
}: BreadcrumbEllipsisProps): ReactElement {
	const { size } = useBreadcrumbPart("Breadcrumb.Ellipsis");
	const slotClass = breadcrumbVariants({ size }).ellipsis({ className });
	const glyph = <BreadcrumbGlyph size={size}>{children ?? <Icon icon={IconDotGrid1x3Horizontal} />}</BreadcrumbGlyph>;

	if (onPress) {
		return (
			<Pressable
				accessibilityLabel={accessibilityLabel ?? resolveBreadcrumbEllipsisLabel(hiddenCount, true)}
				accessibilityRole="button"
				className={slotClass}
				feedback="fade"
				haptic={haptic}
				hitSlop={BREADCRUMB_LINK_HIT_SLOP[size]}
				onPress={onPress}
				{...props}
			>
				{glyph}
			</Pressable>
		);
	}

	return (
		<View
			accessibilityLabel={accessibilityLabel ?? resolveBreadcrumbEllipsisLabel(hiddenCount, false)}
			accessible
			className={slotClass}
			{...props}
		>
			{glyph}
		</View>
	);
}
BreadcrumbEllipsis.displayName = "DelacourUI.Breadcrumb.Ellipsis";
