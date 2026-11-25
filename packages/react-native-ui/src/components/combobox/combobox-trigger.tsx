import { type ReactElement, type ReactNode, useEffect } from "react";
import type { AccessibilityActionEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useMinimumHitTarget, useThemeLength } from "../../hooks/use-minimum-hit-target";
import { IconChevronDownSmall, IconCrossSmall } from "../../icons/central";
import { warnInteractiveChildInAccessible } from "../../lib/interactive-child";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import type { InputSize } from "../input/input.variants";
import { Pressable, type PressableProps } from "../pressable";
import { resolveSelectIconToken, SELECT_CHEVRON_CALM_DURATION_MS, selectVariants } from "../select/select.variants";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { useComboboxPart } from "./combobox.context";
import {
	COMBOBOX_TRIGGER_HEIGHTS,
	comboboxTriggerHeightVariable,
	comboboxVariants,
	resolveComboboxClearHitSlop,
	resolveComboboxTriggerActionOutcome,
	resolveComboboxTriggerActions,
	resolveComboboxTriggerClass,
	resolveComboboxTriggerHitSlop,
	resolveComboboxTriggerLabel,
	resolveVisibleChips,
} from "./combobox.variants";
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
 * and it rings while the sheet is open. A screen reader hears one button named
 * by the enclosing `Field.Label` (with the placeholder while it shows), valued
 * with the label in single mode or "N selected" in multiple. The drawn clear
 * button and chip remove controls are hidden from it and offered as actions on
 * that button instead — `clear` and `remove:<value>`. Read-only draws the chips
 * without their remove control, offers no actions and never opens.
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
	accessibilityActions,
	onAccessibilityAction,
	...props
}: ComboboxTriggerProps): ReactElement {
	const combobox = useComboboxPart("Combobox.Trigger");
	const minimumHitTarget = useMinimumHitTarget();
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
		labels,
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

	const triggerHeight = useThemeLength(comboboxTriggerHeightVariable(size), COMBOBOX_TRIGGER_HEIGHTS[size]);
	const triggerHitSlop = resolveComboboxTriggerHitSlop(triggerHeight, minimumHitTarget);
	const isEditable = !isDisabled && !isReadOnly;
	const hasValue = selectedOptions.length > 0;
	const hasChips = selectionMode === "multiple" && hasValue && children === undefined;
	const hasClear = isClearable && hasValue && isEditable;

	const accessibility = {
		accessibilityHint: isReadOnly ? undefined : labels.triggerHint,
		accessibilityLabel: asChild
			? (accessibilityLabel ?? placeholder)
			: resolveComboboxTriggerLabel({
					hasValue: triggerText !== undefined || children !== undefined,
					label: accessibilityLabel,
					placeholder,
					triggerInField: labels.triggerInField,
				}),
		accessibilityRole: "button" as const,
		accessibilityState: { busy: isLoading || undefined, expanded: isOpen },
		// No value at all rather than an empty one: TalkBack reads an empty value as a stray comma.
		accessibilityValue: triggerText ? { text: triggerText } : undefined,
		testID,
	};

	if (asChild) {
		return (
			<Slot
				{...accessibility}
				accessibilityActions={accessibilityActions}
				disabled={isDisabled}
				onAccessibilityAction={onAccessibilityAction}
				onPress={open}
				{...props}
			>
				{children}
			</Slot>
		);
	}

	warnInteractiveChildInAccessible({ accessible: true, children, component: "Combobox.Trigger" });

	const drawnChips = hasChips
		? selectedOptions.slice(
				0,
				maxVisibleChips === undefined
					? selectedOptions.length
					: resolveVisibleChips({ count: selectedOptions.length, max: maxVisibleChips }).visible
			)
		: [];
	const triggerActions = resolveComboboxTriggerActions({
		canClear: hasClear,
		chips: drawnChips,
		isEditable,
		labels,
	});
	const actions = [...(accessibilityActions ?? []), ...triggerActions];
	const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
		const outcome = resolveComboboxTriggerActionOutcome(event.nativeEvent.actionName, triggerActions);
		if (outcome.type === "clear") clear();
		else if (outcome.type === "remove") remove(outcome.value);
		else onAccessibilityAction?.(event);
	};
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
				isHiddenFromAccessibility
				labels={labels}
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

	// The drawn clear is a duplicate of the trigger's `clear` action, so it carries no name or role
	// of its own: iOS still reports a labelled button that hides only itself.
	const clearButton = hasClear ? (
		<Pressable
			accessibilityElementsHidden
			accessibilityRole="none"
			accessible={false}
			className={slots.clear()}
			feedback="fade"
			hitSlop={resolveComboboxClearHitSlop(size, minimumHitTarget)}
			importantForAccessibility="no-hide-descendants"
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
			accessibilityActions={actions.length > 0 ? actions : undefined}
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
			hitSlop={triggerHitSlop}
			onAccessibilityAction={handleAccessibilityAction}
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
