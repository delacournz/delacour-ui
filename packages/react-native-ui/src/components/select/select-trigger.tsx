import { type ReactElement, type ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { IconChevronDownSmall } from "../../icons/central";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import type { InputSize } from "../input/input.variants";
import { Pressable, type PressableProps } from "../pressable";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { useSelectPart } from "./select.context";
import {
	resolveSelectIconToken,
	resolveSelectTriggerClass,
	SELECT_CHEVRON_CALM_DURATION_MS,
	selectVariants,
} from "./select.variants";

export type SelectTriggerProps = Omit<PressableProps, "onPress" | "disabled" | "children"> & {
	/**
	 * Hand the open press and the accessibility props to the single child
	 * instead of drawing the field box. The child must handle `onPress` — a
	 * `Button`, a `ListGroup.Item`.
	 */
	asChild?: boolean;
	/** Replaces the value and chevron inside the box, or — with `asChild` — the whole trigger. */
	children?: ReactNode;
};

const CHEVRON_SPRING = { damping: 18, mass: 0.6, stiffness: 240 } as const;

/**
 * The chevron, half-turned while the sheet is open.
 *
 * The turn is behaviour rather than decoration — it says which way the control
 * is — so calm motion keeps it and only swaps the spring for a short timing.
 */
function SelectChevron({
	isOpen,
	className,
	color,
	size,
}: {
	isOpen: boolean;
	className: string;
	color: string;
	size: InputSize;
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
		<Animated.View className={className} style={style}>
			<Icon color={color} icon={IconChevronDownSmall} size={size} />
		</Animated.View>
	);
}
SelectChevron.displayName = "DelacourUI.Select.Chevron";

/**
 * The field-shaped control that opens the sheet.
 *
 * `Select` renders one for you. Compose it yourself only to change it: with
 * children it keeps the box and draws them in place of the value; with
 * `asChild` it gives the press to your own control and draws no box at all.
 *
 * The box is Input's own — see `resolveSelectTriggerClass` — and it rings while
 * the sheet is open, so it is clear which field the sheet belongs to. A screen
 * reader hears a button named by the enclosing `Field.Label`, with the current
 * choice as its value and whether the sheet is expanded. Read-only looks normal,
 * answers no press and never opens.
 *
 * @example
 * <Select options={options}>
 *   <Select.Trigger asChild>
 *     <Button variant="outline">Sort</Button>
 *   </Select.Trigger>
 * </Select>
 */
export function SelectTrigger({ asChild = false, className, children, ...props }: SelectTriggerProps): ReactElement {
	const select = useSelectPart("Select.Trigger");
	const {
		accessibilityLabel,
		isDisabled,
		isInvalid,
		isLoading,
		isOpen,
		isReadOnly,
		open,
		placeholder,
		renderValue,
		selectedOptions,
		size,
		testID,
		triggerText,
		variant,
	} = select;

	const accessibility = {
		accessibilityHint: isReadOnly ? undefined : "Opens a list of options",
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

	const slots = selectVariants({ size, variant });
	const iconToken = resolveSelectIconToken(isInvalid);
	const hasValue = selectedOptions.length > 0;

	// Precedence: the caller's own children, then their renderValue for a
	// non-empty selection, then the resolved text or the placeholder.
	const content =
		children ??
		(renderValue && hasValue ? (
			renderValue([...selectedOptions])
		) : (
			<Text className={triggerText ? slots.value() : slots.placeholder()} numberOfLines={1}>
				{triggerText ?? placeholder ?? ""}
			</Text>
		));

	const suffix = isLoading ? (
		<Spinner color={iconToken} size={size} />
	) : (
		<SelectChevron className={slots.chevron()} color={iconToken} isOpen={isOpen} size={size} />
	);

	return (
		<Pressable
			{...accessibility}
			className={resolveSelectTriggerClass({ className, isDisabled, isFocused: isOpen, isInvalid, size, variant })}
			disabled={isDisabled}
			feedback={isReadOnly ? "none" : "fade"}
			onPress={open}
			{...props}
		>
			{content}
			{suffix}
		</Pressable>
	);
}
SelectTrigger.displayName = "DelacourUI.Select.Trigger";
