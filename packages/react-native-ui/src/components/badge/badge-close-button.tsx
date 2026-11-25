import type { ReactElement } from "react";
import { useMinimumHitTarget, useThemeLength } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useBadgePart } from "./badge.context";
import {
	BADGE_CLOSE_SIZES,
	badgeCloseSizeVariable,
	badgeVariants,
	resolveBadgeCloseHitSlop,
	resolveBadgeCloseLabel,
} from "./badge.variants";

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
 * capped at half the badge's gap so it never takes a press from the label beside
 * it. The glyph's edge is read from the theme's `--spacing-icon-*` token, so a
 * denser style is followed. Capped slop leaves the target under the minimum, so
 * the control is named after its badge — "Remove Beta" — not a bare "Remove".
 * A caller's own `hitSlop` and `accessibilityLabel` win.
 *
 * `fade` rather than the root's `scale` — a spring on a glyph this small reads
 * as a jitter rather than as a press.
 */
export function BadgeCloseButton({
	accessibilityLabel,
	className,
	feedback = "fade",
	hitSlop,
	...props
}: BadgeCloseButtonProps): ReactElement {
	const { size, isDisabled, material, labels, labelText } = useBadgePart("Badge.CloseButton");
	const closeSize = useThemeLength(badgeCloseSizeVariable(size), BADGE_CLOSE_SIZES[size]);
	const slop = resolveBadgeCloseHitSlop(size, useMinimumHitTarget(), closeSize);

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? resolveBadgeCloseLabel(labels, labelText)}
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
