import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import type { AccessibilityState } from "react-native";
import Animated from "react-native-reanimated";
import { Pressable, type PressableProps } from "../pressable";
import {
	type GridItemContextValue,
	GridItemProvider,
	useGridItemCellContext,
	useGridItemGroupContext,
} from "./grid-item.context";
import { readGridItemSpan } from "./grid-item.layout";
import {
	type GridItemLabelParts,
	type GridItemSize,
	type GridItemVariant,
	gridItemVariants,
	joinGridItemLabel,
	resolveGridItemRender,
	resolveGridItemSize,
	resolveGridItemVariant,
} from "./grid-item.variants";
import { GridItemActions } from "./grid-item-actions";
import { GridItemBackground } from "./grid-item-background";
import { GridItemDescription } from "./grid-item-description";
import { GridItemFooter } from "./grid-item-footer";
import { GridItemGroup } from "./grid-item-group";
import { GridItemMedia } from "./grid-item-media";
import { GridItemTitle } from "./grid-item-title";
import { GridItemValue } from "./grid-item-value";

export type GridItemProps = Omit<PressableProps, "children" | "disabled"> & {
	/** Cells wide, clamped to the group's columns. Default 1. Read by the group from this prop. */
	colSpan?: number;
	/** Cells tall. Default 1. Read by the group from this prop. */
	rowSpan?: number;
	/** `default` a card, `outline` a border, `muted` a fill, `plain` nothing. Defaults to the group's. */
	variant?: GridItemVariant;
	/** Padding and type scale. Defaults to the group's. */
	size?: GridItemSize;
	isDisabled?: boolean;
	children?: ReactNode;
};

/** How far a pressed tile shrinks — gentler than a button's, because a tile is large. */
const GRID_ITEM_PRESSED_SCALE = 0.98;

function GridItemRoot({
	colSpan,
	rowSpan,
	variant,
	size,
	isDisabled = false,
	feedback = "scale",
	pressedScale = GRID_ITEM_PRESSED_SCALE,
	pressedOpacity,
	haptic,
	busy,
	asChild,
	onPress,
	onLongPress,
	accessibilityLabel,
	accessibilityState,
	className,
	children,
	...props
}: GridItemProps): ReactElement {
	const group = useGridItemGroupContext();
	const cell = useGridItemCellContext();
	const own = readGridItemSpan({ colSpan, rowSpan });
	const resolvedVariant = resolveGridItemVariant(variant, group?.variant);
	const resolvedSize = resolveGridItemSize(size, group?.size);

	const [labelParts, setLabelParts] = useState<GridItemLabelParts>({});
	const registerLabel = useCallback((part: keyof GridItemLabelParts, text: string | undefined) => {
		setLabelParts((previous) => (previous[part] === text ? previous : { ...previous, [part]: text }));
	}, []);

	const context = useMemo<GridItemContextValue>(
		() => ({
			colSpan: cell?.colSpan ?? own.colSpan,
			height: cell?.height ?? 0,
			isDisabled,
			registerLabel,
			rowSpan: cell?.rowSpan ?? own.rowSpan,
			size: resolvedSize,
			variant: resolvedVariant,
			width: cell?.width ?? 0,
		}),
		[cell, own.colSpan, own.rowSpan, isDisabled, registerLabel, resolvedSize, resolvedVariant]
	);

	const content = useMemo(() => backgroundFirst(children), [children]);
	const label = accessibilityLabel ?? joinGridItemLabel(labelParts);
	const rootClassName = gridItemVariants({ isDisabled, size: resolvedSize, variant: resolvedVariant }).root({
		className,
	});

	if (resolveGridItemRender({ onLongPress, onPress }) === "pressable") {
		return (
			<GridItemProvider value={context}>
				<Pressable
					accessibilityLabel={label}
					accessibilityState={accessibilityState}
					asChild={asChild}
					busy={busy}
					className={rootClassName}
					disabled={isDisabled}
					feedback={feedback}
					haptic={haptic}
					onLongPress={onLongPress}
					onPress={onPress}
					pressedOpacity={pressedOpacity}
					pressedScale={pressedScale}
					{...props}
				>
					{content}
				</Pressable>
			</GridItemProvider>
		);
	}

	const state: AccessibilityState = { ...accessibilityState, busy, disabled: isDisabled };

	return (
		<GridItemProvider value={context}>
			<Animated.View
				accessibilityLabel={label}
				accessibilityState={state}
				accessible
				className={rootClassName}
				{...props}
			>
				{content}
			</Animated.View>
		</GridItemProvider>
	);
}

/**
 * Moves every `GridItem.Background` to the front of the children, so it is
 * drawn first — behind the content — wherever the caller wrote it.
 *
 * Lives with the root because the root is what orders its own children.
 */
function backgroundFirst(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const backgrounds = items.filter((child) => isValidElement(child) && child.type === GridItemBackground);
	if (backgrounds.length === 0) return items;
	return [...backgrounds, ...items.filter((child) => !backgrounds.includes(child))];
}

/**
 * A tile in a bento grid: a title, a headline value, a description, media, a
 * background, a footer and corner actions — sized by its group's cells, never
 * by its content.
 *
 * Inside `GridItem.Group` it fills the box the group placed it at from its
 * `colSpan` and `rowSpan`, and takes the group's `variant` and `size` unless it
 * sets its own. Content taller than the box clips: the grid reserves its height
 * before anything loads, so a tile cannot push its neighbours.
 *
 * Give it an `onPress` and it renders as a `Pressable` announced as a button,
 * scaling gently on press; leave it off and it is a plain view. Either way it
 * is one accessibility stop, labelled from its title, value and description
 * unless given an `accessibilityLabel`.
 *
 * @example
 * <GridItem.Group columns={4} gap={12}>
 *   <GridItem colSpan={2} rowSpan={2} onPress={openStorage}>
 *     <GridItem.Background>
 *       <Chart … />
 *     </GridItem.Background>
 *     <GridItem.Title>Storage</GridItem.Title>
 *     <GridItem.Value>74 GB</GridItem.Value>
 *     <GridItem.Description>of 100 GB</GridItem.Description>
 *   </GridItem>
 *   <GridItem>
 *     <GridItem.Media>
 *       <Icon icon={IconWifi} />
 *     </GridItem.Media>
 *     <GridItem.Title>Wi-Fi</GridItem.Title>
 *   </GridItem>
 *   <GridItem colSpan={2}>
 *     <GridItem.Title>Battery</GridItem.Title>
 *     <GridItem.Value>82%</GridItem.Value>
 *   </GridItem>
 * </GridItem.Group>
 */
export const GridItem = Object.assign(GridItemRoot, {
	/** The grid: measures, places each direct child by its spans, and sets its own height. */
	Group: GridItemGroup,
	/** Fills the tile behind its content, clipped to the corner — a gradient, a chart, a big glyph. */
	Background: GridItemBackground,
	/** The leading icon or thumbnail, sized by the tile. */
	Media: GridItemMedia,
	/** The one-line label. */
	Title: GridItemTitle,
	/** The headline metric, in tabular figures. */
	Value: GridItemValue,
	/** One muted line under the value. */
	Description: GridItemDescription,
	/** A strip pushed to the bottom of the tile. */
	Footer: GridItemFooter,
	/** Controls pinned to the top-end corner. */
	Actions: GridItemActions,
	displayName: "DelacourUI.GridItem",
});
