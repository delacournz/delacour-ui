import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { SwipeOpenSide, SwipeSide } from "./swipe.variants";

export type SwipeContextValue = {
	/** The side that is settled open, or null. Changes on a settle, never during a drag. */
	openSide: SwipeOpenSide;
	/** Slides the row aside to reveal `side`. A side with no panel stays shut. */
	open: (side: SwipeSide) => void;
	/** Slides the row back over its panels. */
	close: () => void;
	/** The row's logical offset — positive reveals `start`. Internal to the parts. */
	offset: SharedValue<number>;
	/** Whether the layout runs right to left, read once from `I18nManager`. */
	isRTL: boolean;
	/** Runs a tile's action, then closes the row unless it asks to stay open. */
	runAction: (onPress: () => void, isKeptOpen: boolean) => void;
};

const SwipeContext = createContext<SwipeContextValue | null>(null);

/**
 * Supplies a row's state to its tiles.
 *
 * In a leaf of its own, importing nothing but types, so a part can read it
 * without importing `./swipe` and closing a cycle (package AGENTS.md rule 3).
 */
export function SwipeProvider({ value, children }: { value: SwipeContextValue; children: ReactNode }): ReactElement {
	return <SwipeContext value={value}>{children}</SwipeContext>;
}
SwipeProvider.displayName = "DelacourUI.Swipe.Provider";

/** The enclosing row, or null outside a `<Swipe>`. */
export function useSwipeContext(): SwipeContextValue | null {
	return use(SwipeContext);
}

/**
 * Reads the enclosing row: which side is open, and `open` / `close`.
 *
 * For a custom child of the row that has to close it — a button inside the row
 * that acts and then tucks the actions away. Throws outside a `<Swipe>`.
 */
export function useSwipe(): SwipeContextValue {
	const context = useSwipeContext();
	if (!context) throw new Error("useSwipe must be called inside a <Swipe>.");
	return context;
}

/**
 * The enclosing row, for a part that cannot work without it.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useSwipePart(component: string): SwipeContextValue {
	const context = useSwipeContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Swipe>.`);
	return context;
}

export type SwipeTileContextValue = {
	side: SwipeSide;
	/** Source order within its panel. */
	index: number;
	/** How many tiles share the panel. */
	count: number;
};

const SwipeTileContext = createContext<SwipeTileContextValue | null>(null);

/** Where a tile sits in its panel. The root wraps every tile it lifts out in one. */
export function SwipeTileProvider({
	value,
	children,
}: {
	value: SwipeTileContextValue;
	children: ReactNode;
}): ReactElement {
	return <SwipeTileContext value={value}>{children}</SwipeTileContext>;
}
SwipeTileProvider.displayName = "DelacourUI.Swipe.TileProvider";

/**
 * A tile's place in its panel. Internal.
 *
 * Throws when a `Swipe.Action` was rendered anywhere but inside `Swipe.Start`
 * or `Swipe.End` — the root lifts tiles out of those two markers only.
 */
export function useSwipeTilePart(component: string): SwipeTileContextValue {
	const context = use(SwipeTileContext);
	if (!context) throw new Error(`${component} must be written inside <Swipe.Start> or <Swipe.End>.`);
	return context;
}

export type SwipeGroupContextValue = {
	/** Adds a row's close to the group. Returns the matching unregister. */
	register: (id: string, close: () => void) => () => void;
	/** Tells the group `id` has opened, so an exclusive group closes the rest. */
	notifyOpen: (id: string) => void;
	/** Closes every row in the group. */
	closeAll: () => void;
};

const SwipeGroupContext = createContext<SwipeGroupContextValue | null>(null);

/** Supplies a group's registry to the rows beneath it, however deeply they are nested. */
export function SwipeGroupProvider({
	value,
	children,
}: {
	value: SwipeGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <SwipeGroupContext value={value}>{children}</SwipeGroupContext>;
}
SwipeGroupProvider.displayName = "DelacourUI.Swipe.Group.Provider";

/** The enclosing group, or null for a row standing on its own. */
export function useSwipeGroupContext(): SwipeGroupContextValue | null {
	return use(SwipeGroupContext);
}

const NO_GROUP = { closeAll: () => {} } as const;

/**
 * Closes every row in the enclosing `Swipe.Group` — before a list scrolls away,
 * or when a screen loses focus.
 *
 * Outside a group it returns a no-op rather than throwing, so a screen can call
 * it whether or not its rows are grouped.
 */
export function useSwipeGroup(): { closeAll: () => void } {
	const group = useSwipeGroupContext();
	return group ? { closeAll: group.closeAll } : NO_GROUP;
}
