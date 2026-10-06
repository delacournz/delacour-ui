import { type ReactElement, useCallback, useMemo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Icon, type IconComponent } from "../icon/icon";
import { IconDefaultsProvider } from "../icon/icon.context";
import { Pressable } from "../pressable/pressable";
import { Text } from "../text/text";
import { useSwipePart, useSwipeTilePart } from "./swipe.context";
import {
	resolveSwipeActionForegroundToken,
	SWIPE_TILE_WIDTH,
	type SwipeActionColor,
	swipeVariants,
} from "./swipe.variants";

export type SwipeActionProps = {
	/** The tile's caption, and the name a screen reader offers the action under. Required. */
	label: string;
	/** A Central Icon component, drawn above the label at the tile's size and ink. */
	icon?: IconComponent;
	color?: SwipeActionColor;
	onPress: () => void;
	/** Leave the row open after the action runs — for a toggle such as a bookmark. */
	isKeptOpen?: boolean;
	className?: string;
	labelClassName?: string;
};

/**
 * One tile behind the row.
 *
 * Positioned by its own animated style off the row's offset: short of fully
 * open it is overlapped by the tile outside it, so the set emerges from under
 * the row; past fully open the outermost tile grows into the overshoot. The
 * worklet restates `resolveTileLayout`, which the tests pin.
 *
 * Takes the icon as a **component** rather than composed children, because the
 * tile has to size and tint the glyph itself; it renders it through
 * `IconDefaultsProvider`, the same inheritance a `Button` uses.
 */
export function SwipeAction({
	label,
	icon,
	color = "default",
	onPress,
	isKeptOpen = false,
	className,
	labelClassName,
}: SwipeActionProps): ReactElement {
	const swipe = useSwipePart("Swipe.Action");
	const { side, index, count } = useSwipeTilePart("Swipe.Action");
	const { offset, runAction } = swipe;
	const slots = swipeVariants({ color, side });
	const order = side === "end" ? index : count - 1 - index;

	const tileStyle = useAnimatedStyle(() => {
		const tileWidth = SWIPE_TILE_WIDTH;
		const reveal = Math.max(0, side === "start" ? offset.value : -offset.value);
		const total = count * tileWidth;
		const isPacked = reveal <= total;
		const x = isPacked ? (count > 0 ? (order * reveal) / count : 0) : order * tileWidth;
		const width = !isPacked && order === count - 1 ? reveal - order * tileWidth : tileWidth;
		return side === "end" ? { start: x, width } : { end: x, width };
	});

	const handlePress = useCallback(() => runAction(onPress, isKeptOpen), [isKeptOpen, onPress, runAction]);
	const iconDefaults = useMemo(
		() => ({ className: "size-icon-md", color: resolveSwipeActionForegroundToken(color) }),
		[color]
	);

	return (
		<Animated.View className={slots.tile({ className })} style={[{ zIndex: order }, tileStyle]}>
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				className={slots.tilePressable()}
				feedback="fade"
				onPress={handlePress}
			>
				<View className={slots.tileContent()}>
					{icon ? (
						<IconDefaultsProvider value={iconDefaults}>
							<Icon icon={icon} />
						</IconDefaultsProvider>
					) : null}
					<Text className={slots.tileLabel({ className: labelClassName })} numberOfLines={1}>
						{label}
					</Text>
				</View>
			</Pressable>
		</Animated.View>
	);
}
SwipeAction.displayName = "DelacourUI.Swipe.Action";
