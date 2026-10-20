import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Chip } from "../chip";
import type { ChipVariant } from "../chip/chip.variants";
import type { InputSize } from "../input/input.variants";
import type { SelectOption } from "../select/select.types";
import {
	COMBOBOX_CHIP_LAYOUT_MS,
	comboboxVariants,
	resolveComboboxChipColor,
	resolveComboboxChipSize,
	resolveVisibleChips,
} from "./combobox.variants";

export type ComboboxChipRowProps = {
	options: readonly SelectOption[];
	size: InputSize;
	chipVariant: ChipVariant;
	/** The chip one more Backspace would remove, drawn destructive. */
	pendingIndex?: number | null;
	/** Leave it off and the chips draw no remove control — read-only, or disabled. */
	onRemove?: (value: string) => void;
	/** A press on a chip's body. Makes each chip a button, which is what offers `remove` as an action. */
	onChipPress?: () => void;
	/** Cap the chips and fold the rest into `+N`. Leave it off to draw every chip. */
	maxVisible?: number;
	className?: string;
	/** Chips take `${testID}-chip-${value}`, their remove controls `-remove-${value}`. */
	testID?: string;
};

/**
 * The selection as a wrapping row of chips — on the trigger, and above the
 * search field in the sheet.
 *
 * Each chip is wrapped in an `Animated.View` with a 150ms layout transition,
 * so a removal closes the gap rather than snapping it shut. Calm motion drops
 * the transition entirely: the chips land where they land.
 *
 * Internal; not on the index.
 */
export function ComboboxChipRow({
	options,
	size,
	chipVariant,
	pendingIndex = null,
	onRemove,
	onChipPress,
	maxVisible,
	className,
	testID,
}: ComboboxChipRowProps): ReactElement {
	const isCalm = useCalmMotion();
	const slots = comboboxVariants({ size });
	const chipSize = resolveComboboxChipSize(size);
	const { visible, overflow } =
		maxVisible === undefined
			? { overflow: 0, visible: options.length }
			: resolveVisibleChips({ count: options.length, max: maxVisible });

	const layout = isCalm ? undefined : LinearTransition.duration(COMBOBOX_CHIP_LAYOUT_MS);
	const entering = isCalm ? undefined : FadeIn.duration(COMBOBOX_CHIP_LAYOUT_MS);
	const exiting = isCalm ? undefined : FadeOut.duration(COMBOBOX_CHIP_LAYOUT_MS);

	return (
		<View className={slots.chips({ className })}>
			{options.slice(0, visible).map((option, index) => (
				<Animated.View entering={entering} exiting={exiting} key={option.value} layout={layout}>
					<Chip
						closeAccessibilityLabel={`Remove ${option.label}`}
						closeTestID={testID ? `${testID}-remove-${option.value}` : undefined}
						color={resolveComboboxChipColor(index === pendingIndex)}
						onClose={onRemove ? () => onRemove(option.value) : undefined}
						onPress={onChipPress}
						size={chipSize}
						testID={testID ? `${testID}-chip-${option.value}` : undefined}
						variant={chipVariant}
					>
						{option.label}
					</Chip>
				</Animated.View>
			))}
			{overflow > 0 ? (
				<Animated.View key="overflow" layout={layout}>
					<Chip
						accessibilityLabel={`${overflow} more`}
						className={slots.chipOverflow()}
						onPress={onChipPress}
						size={chipSize}
						variant="outline"
					>
						{`+${overflow}`}
					</Chip>
				</Animated.View>
			) : null}
		</View>
	);
}
ComboboxChipRow.displayName = "DelacourUI.Combobox.ChipRow";
