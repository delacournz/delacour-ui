import { type ReactElement, type ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { IconChevronDownSmall, IconCrossSmall } from "../../icons/central";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import type { InputSize } from "../input/input.variants";
import { Pressable, type PressableProps } from "../pressable";
import { resolveSelectIconToken, SELECT_CHEVRON_CALM_DURATION_MS, selectVariants } from "../select/select.variants";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { useComboboxPart } from "./combobox.context";
import { comboboxVariants, resolveComboboxTriggerClass } from "./combobox.variants";
import { ComboboxChipRow } from "./combobox-chip-row";

export type ComboboxTriggerProps = Omit<PressableProps, "onPress" | "disabled" | "children"> & {
	/**
	 * Hand the open press and the accessibility props to the single child
	 * instead of drawing the field box. The child must handle `onPress`.
	 */
	asChild?: boolean;
	/** Replaces the value and chevron inside the box, or — with `asChild` — the whole trigger. */
	children?: ReactNode;
};

const CHEVRON_SPRING = { damping: 18, mass: 0.6, stiffness: 240 } as const;

const CLEAR_HIT_SLOP = 8;

/**
 * The chevron, half-turned while the sheet is open — Select's, motion and
 * calm-motion fallback alike. Select keeps its own private, so this is the
 * second copy; consolidating the pickers' triggers is a follow-up.
 */
function ComboboxChevron({
	isOpen,
	className,
	color,
	size,
	testID,
}: {
	isOpen: boolean;
	className: string;
	color: string;
	size: InputSize;
	testID?: string;
}): ReactElement {
	const isCalm = useCalmMotion();
	const turn = useSharedValue(isOpen ? 1 : 0);

	useEffect(() => {
		const target = isOpen ? 1 : 0;
		turn.value = isCalm
			? withTiming(target, { duration: SELECT_CHEVRON_CALM_DURATION_MS })
			: withSpring(target, CHEVRON_SPRING);
	}, [isCalm, isOpen, turn]);

	const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));

	return (
		<Animated.View className={className} style={style} testID={testID}>
			<Icon color={color} icon={IconChevronDownSmall} size={size} />
		</Animated.View>
	);
}
ComboboxChevron.displayName = "DelacourUI.Combobox.Chevron";

/**
 * The field-shaped control that opens the sheet.
 *
 * `Combobox` renders one for you. Single mode reads the chosen label; multiple
 * mode draws the selection as removable chips that wrap and grow the box, with
 * the rest folded into `+N` past the cap. A clear button sits before the
 * chevron when the combobox is clearable and holds a value.
 *
 * The box is Select's, which is Input's — see `resolveComboboxTriggerClass` —
 * and it rings while the sheet is open. A screen reader hears a button named
 * by the enclosing `Field.Label`, valued with the label in single mode or
 * "N selected" in multiple; each chip is its own element with a `remove`
 * action. Read-only draws the chips without their remove control and never
 * opens.
 *
 * @example
 * <Combobox options={people}>
 *   <Combobox.Trigger asChild>
 *     <Button variant="outline">Assign</Button>
 *   </Combobox.Trigger>
 * </Combobox>
 */
export function ComboboxTrigger({
	asChild = false,
	className,
	children,
	...props
}: ComboboxTriggerProps): ReactElement {
	const combobox = useComboboxPart("Combobox.Trigger");
	const {
		accessibilityLabel,
		chipVariant,
		clear,
		isClearable,
		isDisabled,
		isInvalid,
		isLoading,
		isOpen,
		isReadOnly,
		maxVisibleChips,
		open,
		placeholder,
		remove,
		selectedOptions,
		selectionMode,
		size,
		testID,
		triggerText,
		variant,
	} = combobox;

	const accessibility = {
		accessibilityHint: isReadOnly ? undefined : "Opens a searchable list of options",
		accessibilityLabel: accessibilityLabel ?? placeholder,
		accessibilityRole: "button" as const,
		accessibilityState: { expanded: isOpen },
		accessibilityValue: { text: triggerText ?? "" },
		testID,
	};

	if (asChild) {
		return (
			<Slot {...accessibility} disabled={isDisabled} onPress={open} {...props}>
				{children}
			</Slot>
		);
	}

	const isEditable = !isDisabled && !isReadOnly;
	const hasValue = selectedOptions.length > 0;
	const hasChips = selectionMode === "multiple" && hasValue && children === undefined;
	const select = selectVariants({ size, variant });
	const slots = comboboxVariants({ size, variant });
	const iconToken = resolveSelectIconToken(isInvalid);

	// Precedence: the caller's own children, then chips for a multiple
	// selection, then the label or the placeholder.
	const content =
		children ??
		(hasChips ? (
			<ComboboxChipRow
				chipVariant={chipVariant}
				maxVisible={maxVisibleChips}
				onChipPress={isEditable ? open : undefined}
				onRemove={isEditable ? remove : undefined}
				options={selectedOptions}
				size={size}
				testID={testID}
			/>
		) : (
			<Text className={triggerText ? select.value() : select.placeholder()} numberOfLines={1}>
				{selectionMode === "single" ? (triggerText ?? placeholder ?? "") : (placeholder ?? "")}
			</Text>
		));

	const clearButton =
		isClearable && hasValue && isEditable ? (
			<Pressable
				accessibilityLabel="Clear"
				accessibilityRole="button"
				className={slots.clear()}
				feedback="fade"
				hitSlop={CLEAR_HIT_SLOP}
				onPress={clear}
				testID={testID ? `${testID}-clear` : undefined}
			>
				<Icon color={iconToken} icon={IconCrossSmall} size={size} />
			</Pressable>
		) : null;

	const suffix = isLoading ? (
		<Spinner color={iconToken} size={size} />
	) : (
		<ComboboxChevron
			className={select.chevron()}
			color={iconToken}
			isOpen={isOpen}
			size={size}
			testID={testID ? `${testID}-chevron` : undefined}
		/>
	);

	return (
		<Pressable
			{...accessibility}
			className={resolveComboboxTriggerClass({
				className,
				hasChips,
				isDisabled,
				isFocused: isOpen,
				isInvalid,
				size,
				variant,
			})}
			disabled={isDisabled}
			feedback={isReadOnly ? "none" : "fade"}
			onPress={open}
			{...props}
		>
			{content}
			{clearButton}
			{suffix}
		</Pressable>
	);
}
ComboboxTrigger.displayName = "DelacourUI.Combobox.Trigger";
