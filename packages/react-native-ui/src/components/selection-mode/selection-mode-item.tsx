import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo } from "react";
import { type AccessibilityActionEvent, View, type ViewProps, type ViewStyle } from "react-native";
import Animated, {
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { Pressable } from "../pressable";
import {
	type SelectionModeItemContextValue,
	SelectionModeItemProvider,
	useSelectionModePart,
} from "./selection-mode.context";
import {
	resolveIndicatorShown,
	resolveItemAccessibility,
	resolveItemPress,
	SELECTION_MODE_INDICATOR_OFFSET,
	SELECTION_MODE_MOTION,
	type SelectionIndicator,
	selectionModeVariants,
} from "./selection-mode.variants";
import { SelectionModeIndicator, SelectionModeRing } from "./selection-mode-indicator";

export type SelectionModeItemProps = Omit<ViewProps, "children"> & {
	/** The item's id. Selection is a set of ids, never indices. */
	value: string;
	/** What it wraps — a row, an avatar, a swatch. */
	children: ReactNode;
	/** The item's own press, run while the mode is off — and always, for a disabled item. */
	onPress?: () => void;
	/** Cannot start the mode or be picked. Its own `onPress` still runs. */
	isDisabled?: boolean;
	/** How it shows it is picked. Default `leading`. */
	indicator?: SelectionIndicator;
	/** Show the indicator even while the mode is off — an always-on picker. */
	isIndicatorAlwaysShown?: boolean;
	className?: string;
	/** Reshapes the `ring` to the item's own corner — `rounded-full` around a round swatch. */
	ringClassName?: string;
};

/**
 * Slides a `leading` indicator in: a spacer opens from 0 to 34pt and pushes the
 * content over while the mark fades in. Under reduced motion the spacer snaps
 * and only the fade plays, 150ms.
 */
function useLeadingStyles(isShown: boolean): {
	spacerStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
	markStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
} {
	const isReducedMotion = useReducedMotion();
	const slide = useSharedValue(isShown ? 1 : 0);
	const fade = useSharedValue(isShown ? 1 : 0);

	useEffect(() => {
		const target = isShown ? 1 : 0;
		if (isReducedMotion) {
			slide.value = target;
			fade.value = withTiming(target, {
				duration: SELECTION_MODE_MOTION.reducedFadeMs,
				reduceMotion: ReduceMotion.Never,
			});
			return;
		}
		slide.value = withSpring(target, SELECTION_MODE_MOTION.spring);
		fade.value = withTiming(target, { duration: SELECTION_MODE_MOTION.fadeMs });
	}, [fade, isReducedMotion, isShown, slide]);

	const offset = SELECTION_MODE_INDICATOR_OFFSET;
	const spacerStyle = useAnimatedStyle(() => ({ width: slide.value * offset }));
	const markStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
	return { markStyle, spacerStyle };
}

/**
 * One pickable thing. Wraps whatever it holds rather than replacing it.
 *
 * Off, a press runs the item's own `onPress` and a long press turns the mode on
 * with this item picked. On, a press toggles it and `onPress` does not run. A
 * disabled item never toggles and never starts the mode, but keeps its own
 * press — a section header, a "load more" row.
 *
 * While the mode is on it is announced as a checkbox; while off it keeps the
 * semantics of what it wraps and offers "Start selecting" as an action.
 */
export function SelectionModeItem({
	value,
	children,
	onPress,
	isDisabled = false,
	indicator = "leading",
	isIndicatorAlwaysShown = false,
	className,
	ringClassName,
	onAccessibilityAction,
	...props
}: SelectionModeItemProps): ReactElement {
	const selection = useSelectionModePart("SelectionMode.Item");
	const { isActive, toggle, enter } = selection;
	const isSelected = selection.isSelected(value);
	const isShown = resolveIndicatorShown({ indicator, isActive, isIndicatorAlwaysShown });

	const press = resolveItemPress({ hasOnPress: onPress !== undefined, isActive, isDisabled });
	const pressKind = press.kind;
	const handlePress = useCallback(() => {
		if (pressKind === "toggle") toggle(value);
		else if (pressKind === "press") onPress?.();
	}, [onPress, pressKind, toggle, value]);

	const canEnter = !isActive && !isDisabled;
	const handleLongPress = useCallback(() => enter(value), [enter, value]);

	const accessibility = resolveItemAccessibility({ isActive, isDisabled, isSelected });
	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (canEnter && event.nativeEvent.actionName === "longpress") enter(value);
			onAccessibilityAction?.(event);
		},
		[canEnter, enter, onAccessibilityAction, value]
	);
	const accessibilityProps =
		accessibility.kind === "checkbox"
			? {
					accessibilityHint: accessibility.accessibilityHint,
					accessibilityRole: accessibility.accessibilityRole,
					accessibilityState: accessibility.accessibilityState,
				}
			: {
					accessibilityActions: accessibility.accessibilityActions,
					accessibilityRole: onPress ? ("button" as const) : undefined,
				};

	const context = useMemo<SelectionModeItemContextValue>(
		() => ({ indicator, isDisabled, isSelected, value }),
		[indicator, isDisabled, isSelected, value]
	);

	const slots = selectionModeVariants({ indicator, isSelected: isSelected && isShown });
	const { markStyle, spacerStyle } = useLeadingStyles(isShown);

	// A leading item is a row: a spacer that opens to push the content over, the
	// content, then the mark drawn on top of the gap the spacer made. The mark
	// comes last so a child with a fill of its own never paints over it.
	const content =
		indicator === "leading" ? (
			<>
				<Animated.View style={spacerStyle} />
				<View className="flex-1">{children}</View>
				<Animated.View className={slots.indicatorSlot()} pointerEvents="none" style={markStyle}>
					<SelectionModeIndicator />
				</Animated.View>
			</>
		) : (
			<>
				{children}
				{indicator === "ring" && isShown && isSelected ? (
					<SelectionModeRing className={ringClassName} isSelected={isSelected} />
				) : null}
			</>
		);

	return (
		<SelectionModeItemProvider value={context}>
			<Pressable
				className={slots.item({ className })}
				feedback={indicator === "leading" ? "fade" : "scale"}
				onAccessibilityAction={handleAccessibilityAction}
				onLongPress={canEnter ? handleLongPress : undefined}
				onPress={pressKind === "none" ? undefined : handlePress}
				{...accessibilityProps}
				{...props}
			>
				{content}
			</Pressable>
		</SelectionModeItemProvider>
	);
}
SelectionModeItem.displayName = "DelacourUI.SelectionMode.Item";
