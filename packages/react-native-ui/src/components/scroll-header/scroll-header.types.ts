import type { ReactNode } from "react";
import type { NativeScrollEvent, ViewProps } from "react-native";
import type { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";
import type { ScrollSource, ScrollSourceProps } from "../../hooks/use-scroll-source";

export type ScrollHeaderProps = ViewProps & {
	/** Fraction of the Large block's height at which the bar has fully taken over, 0.1-1. @default 1 */
	threshold?: number;
	/** Settle a half-scrolled header open or closed when the scroller comes to rest. @default true */
	snap?: boolean;
	/** Let the cover grow when pulled down past the top. Off under Reduce Motion. @default true */
	stretch?: boolean;
	/** Fires once per crossing of fully collapsed, not per frame. Runs on the JS thread. */
	onCollapsedChange?: (isCollapsed: boolean) => void;
	/** Written every frame, 0 (open) to 1 (collapsed), for effects outside the header. */
	progress?: SharedValue<number>;
	children: ReactNode;
	className?: string;
};

/**
 * A scroller part's own `onScroll`: a Reanimated handler (`useAnimatedScrollHandler`), composed
 * on the UI thread with the header's, or a plain function, called on the JS thread with the
 * event's payload — the `nativeEvent` a plain `ScrollView` would have handed it.
 */
export type ScrollHeaderOnScroll =
	| ScrollHandlerProcessed<Record<string, unknown>>
	| ((event: NativeScrollEvent) => void);

/** Shared by `ScrollHeader.ScrollView` and `ScrollHeader.FlatList`. */
export type ScrollHeaderScrollableProps = {
	onScroll?: ScrollHeaderOnScroll;
	contentContainerClassName?: string;
	className?: string;
};

/** What a custom scroller — a `SectionList`, a `LegendList` — needs from the header. */
export type ScrollHeaderContextValue = {
	/** The header's scroll source, also published through `ScrollSourceProvider`. */
	source: ScrollSource;
	/** Spread onto the scroller. Includes the snap handlers. */
	scrollProps: ScrollSourceProps;
	/** 0 (open) to 1 (collapsed). */
	progress: SharedValue<number>;
	/** Points of scroll from open to collapsed; 0 with no Large block. */
	collapseDistance: SharedValue<number>;
	/** Safe-area band + bar + Large block — what the scroller must clear at rest. */
	topInset: SharedValue<number>;
};

/** The parts' view of the root: the public value plus what only the parts read. */
export type ScrollHeaderInternalContextValue = ScrollHeaderContextValue & {
	safeAreaTop: number;
	/** The bar row's height, safe-area band excluded. */
	barHeight: SharedValue<number>;
	largeHeight: SharedValue<number>;
	hasLarge: boolean;
	/** JS mirror of `progress >= 1`, updated once per crossing — what accessibility reads. */
	isCollapsed: boolean;
	/** `stretch`, already off under Reduce Motion. */
	isStretchEnabled: boolean;
	/** Called by `ScrollHeader.Large` on mount; returns its unregister. */
	registerLarge: () => () => void;
	/** Called by every scroller part on mount; returns its unregister. */
	registerScroller: () => () => void;
};
