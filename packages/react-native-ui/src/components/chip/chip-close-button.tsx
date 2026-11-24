import type { ReactElement } from "react";
import { I18nManager } from "react-native";
import { useMinimumHitTarget } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useChipPart } from "./chip.context";
import { chipVariants, resolveChipCloseHitSlop } from "./chip.variants";

export type ChipCloseButtonProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled">;

/**
 * The chip's trailing remove control.
 *
 * A pressable of its own rather than a mode of the root, which is what keeps a
 * removal from also toggling the chip or firing its `onPress`: the two gestures
 * belong to two detectors, and the inner one claims the tap.
 *
 * The root composes one in whenever `onClose` is set, so reach for this by hand
 * only to place it somewhere other than last.
 *
 * The glyph is left bare: it inherits the chip's icon size and its current
 * surface's colour from the root's `IconDefaultsProvider`, so it turns with the
 * label when the chip is selected. The 14–18 point glyph grows towards the minimum
 * touch target with `hitSlop`, capped so it never reaches a neighbouring chip,
 * and on its leading side so it never takes a press meant for the label.
 */
export function ChipCloseButton({
	accessibilityLabel = "Remove",
	className,
	feedback = "fade",
	hitSlop,
	...props
}: ChipCloseButtonProps): ReactElement {
	const { size, isDisabled } = useChipPart("Chip.CloseButton");
	const slop = resolveChipCloseHitSlop(size, useMinimumHitTarget(), { isRTL: I18nManager.isRTL });

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={chipVariants({ size }).closeButton({ className })}
			disabled={isDisabled}
			feedback={feedback}
			hitSlop={hitSlop ?? slop}
			{...props}
		>
			<Icon icon={IconCrossSmall} />
		</Pressable>
	);
}
ChipCloseButton.displayName = "DelacourUI.Chip.CloseButton";
