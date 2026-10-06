import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SwipeTileProvider, useSwipePart } from "./swipe.context";
import { resolveOutermostIndex, type SwipeSide, type SwipeTileProps, swipeVariants } from "./swipe.variants";

type SwipePanelLayerProps = {
	side: SwipeSide;
	/** The `Swipe.Action` elements lifted out of the side's marker. */
	tiles: ReactElement<SwipeTileProps>[];
	/** Hidden from assistive technology while the row is shut. */
	isHidden: boolean;
};

const START_EDGE = { start: 0 } as const;
const END_EDGE = { end: 0 } as const;

/**
 * The layer behind one edge of the row. Internal: the root renders one per side
 * that has tiles.
 *
 * **Exactly as wide as the gap the row has left**, animated off the same offset
 * the row moves on — never wider, so it cannot paint over a row that has no
 * background of its own, and never narrower, so there is no hole. Its own
 * colour is the outermost tile's, so the overshoot that tile grows into reads
 * as the same action.
 *
 * Pinned by logical `start` / `end` rather than `left` / `right`, so the layout
 * mirrors under right to left with no sign of its own; only the row's
 * translation has to flip.
 */
export function SwipePanelLayer({ side, tiles, isHidden }: SwipePanelLayerProps): ReactElement {
	const { offset } = useSwipePart("Swipe.Panel");
	const outermost = tiles[resolveOutermostIndex(side, tiles.length)];
	const slots = swipeVariants({ color: outermost?.props.color ?? "default", side });

	const panelStyle = useAnimatedStyle(() => ({
		width: Math.max(0, side === "start" ? offset.value : -offset.value),
	}));

	return (
		<Animated.View
			accessibilityElementsHidden={isHidden}
			className={slots.panel()}
			importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
			style={[side === "start" ? START_EDGE : END_EDGE, panelStyle]}
		>
			{tiles.map((tile, index) => (
				<SwipeTileProvider key={tile.key ?? index} value={{ count: tiles.length, index, side }}>
					{tile}
				</SwipeTileProvider>
			))}
		</Animated.View>
	);
}
SwipePanelLayer.displayName = "DelacourUI.Swipe.Panel";
