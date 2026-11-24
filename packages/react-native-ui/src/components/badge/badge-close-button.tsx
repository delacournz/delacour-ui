import type { ReactElement } from "react";
import { I18nManager } from "react-native";
import { useMinimumHitTarget } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useBadgePart } from "./badge.context";
import { badgeVariants, resolveBadgeCloseHitSlop } from "./badge.variants";

export type BadgeCloseButtonProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled">;

/**
 * The badge's trailing dismiss control.
 *
 * A pressable of its own rather than a mode of the root, which is what keeps a
 * dismiss from also firing the badge's `onPress`: the two gestures belong to two
 * detectors, and the inner one claims the tap.
 *
 * The root composes one in whenever `onClose` is set, so reach for this by hand
 * only to place it somewhere other than last — before an `EndContent`, say.
 *
 * The glyph is left bare: it inherits the badge's icon size and its surface's
 * colour from the root's `IconDefaultsProvider`, so a dismiss on a `destructive`
 * badge is tinted without being told.
 *
 * The glyph is 14–18pt, so it carries `hitSlop` up to the app's minimum target,
 * capped at half the badge's gap on the label's side so it never takes a press
 * from the label, and at the badge's own edge on the others. A caller's own
 * `hitSlop` wins.
 *
 * `fade` rather than the root's `scale` — a spring on a glyph this small reads
 * as a jitter rather than as a press.
 */
export function BadgeCloseButton({
	accessibilityLabel = "Remove",
	className,
	feedback = "fade",
	hitSlop,
	...props
}: BadgeCloseButtonProps): ReactElement {
	const { size, isDisabled, material } = useBadgePart("Badge.CloseButton");
	const slop = resolveBadgeCloseHitSlop(size, useMinimumHitTarget(), { isRTL: I18nManager.isRTL });

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={badgeVariants({ material, size }).closeButton({ className })}
			disabled={isDisabled}
			feedback={feedback}
			hitSlop={hitSlop ?? slop}
			{...props}
		>
			<Icon icon={IconCrossSmall} />
		</Pressable>
	);
}
BadgeCloseButton.displayName = "DelacourUI.Badge.CloseButton";
