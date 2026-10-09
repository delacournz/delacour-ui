import { type ReactElement, type ReactNode, useCallback, useMemo, useRef } from "react";
import { type AccessibilityState, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Icon } from "../icon";
import { playHaptic } from "../pressable/pressable";
import { Text } from "../text";
import { useMenuPart } from "./menu.context";
import type { MenuItemProps } from "./menu.types";
import {
	MENU_ICON_TOKEN,
	MENU_PRESS,
	MENU_TAP_MAX_DISTANCE,
	type MenuRowKind,
	menuVariants,
	resolveCloseOnSelect,
	resolveMenuItemAccessibility,
} from "./menu.variants";

export type { MenuItemProps } from "./menu.types";

export type MenuRowProps = MenuItemProps & {
	/** Which kind of row this is — decides whether choosing it closes the menu. */
	kind: MenuRowKind;
	/** Replaces the leading icon column — a checkbox's tick, a radio's mark. */
	leading?: ReactNode;
	accessibilityState?: AccessibilityState;
};

/**
 * The row every menu row is built on: the press fill, the scale, the label
 * column, the icon, the shortcut and the trailing slot.
 *
 * **The fill is the row's background**, an absolute layer whose opacity a tap
 * drives — 90ms in, 160ms out — while the row dips to 0.98. Both read one shared
 * value on the UI thread. Under reduced motion the fill snaps and the scale does
 * not run: the fill is colour, not movement, and it is what says the tap landed.
 *
 * **A tap that travels is a scroll**, so the tap fails past
 * `MENU_TAP_MAX_DISTANCE` and a long menu scrolls without choosing a row.
 *
 * Exported from this leaf, not from `index.ts`, so ContextMenu can build on it
 * with `import { MenuRow } from "../menu/menu-item"` without pulling the root.
 */
export function MenuRow({
	kind,
	leading,
	children,
	className,
	icon,
	iconPlacement = "leading",
	description,
	shortcut,
	trailing,
	variant = "default",
	isInset = false,
	isDisabled = false,
	isClosedOnSelect,
	onSelect,
	accessibilityState,
	...props
}: MenuRowProps): ReactElement {
	const { close, haptic } = useMenuPart("Menu.Item");
	const isReducedMotion = useReducedMotion();
	const slots = menuVariants({ isDisabled, isInset, variant });
	const shouldClose = resolveCloseOnSelect(kind, isClosedOnSelect);

	const selectRef = useRef(onSelect);
	selectRef.current = onSelect;
	const handleSelect = useCallback(() => {
		selectRef.current?.();
		if (shouldClose) close();
	}, [close, shouldClose]);

	const pressed = useSharedValue(0);
	const inMs = isReducedMotion ? 0 : MENU_PRESS.inMs;
	const outMs = isReducedMotion ? 0 : MENU_PRESS.outMs;
	const pressedScale = isReducedMotion ? 1 : MENU_PRESS.scale;

	const gesture = useMemo(
		() =>
			Gesture.Tap()
				.enabled(!isDisabled)
				.maxDistance(MENU_TAP_MAX_DISTANCE)
				.shouldCancelWhenOutside(true)
				.onBegin(() => {
					"worklet";
					pressed.value = withTiming(1, { duration: inMs });
				})
				.onEnd(() => {
					"worklet";
					if (haptic) playHaptic(haptic);
					scheduleOnRN(handleSelect);
				})
				.onFinalize(() => {
					"worklet";
					pressed.value = withTiming(0, { duration: outMs });
				}),
		[handleSelect, haptic, inMs, isDisabled, outMs, pressed]
	);

	const rowStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }],
	}));
	const fillStyle = useAnimatedStyle(() => ({ opacity: pressed.value }));

	const glyph = icon ? <Icon className={slots.itemIcon()} color={MENU_ICON_TOKEN[variant]} icon={icon} /> : null;
	const isLeadingIcon = iconPlacement === "leading";
	const leadingNode =
		leading ?? (isLeadingIcon && glyph ? glyph : isInset ? <View className={slots.indicator()} /> : null);
	const label =
		typeof children === "string" || typeof children === "number" ? (
			<Text className={slots.itemLabel()} numberOfLines={1}>
				{children}
			</Text>
		) : (
			children
		);

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessibilityRole="menuitem"
				accessibilityState={accessibilityState ?? resolveMenuItemAccessibility({ isDisabled, kind: "item" })}
				accessible
				className={slots.item({ className })}
				style={rowStyle}
				{...props}
			>
				<Animated.View className={slots.itemFill()} pointerEvents="none" style={fillStyle} />
				{leadingNode}
				<View className={slots.itemContent()}>
					{label}
					{description ? <Text className={slots.itemDescription()}>{description}</Text> : null}
				</View>
				{shortcut ? <Text className={slots.itemShortcut()}>{shortcut}</Text> : null}
				{!isLeadingIcon ? glyph : null}
				{trailing}
			</Animated.View>
		</GestureDetector>
	);
}
MenuRow.displayName = "DelacourUI.Menu.Row";

/**
 * A verb: one row that runs `onSelect` and closes the menu.
 *
 * @example
 * <Menu.Item icon={IconPencil} shortcut="⌘R" onSelect={rename}>Rename</Menu.Item>
 */
export function MenuItem({ isDisabled = false, ...props }: MenuItemProps): ReactElement {
	return (
		<MenuRow
			accessibilityState={resolveMenuItemAccessibility({ isDisabled, kind: "item" })}
			isDisabled={isDisabled}
			kind="item"
			{...props}
		/>
	);
}
MenuItem.displayName = "DelacourUI.Menu.Item";
