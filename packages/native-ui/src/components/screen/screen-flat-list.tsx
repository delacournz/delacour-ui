import { type ReactElement, type Ref, useMemo } from "react";
import { FlatList, type FlatListProps, View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../../lib/cn";
import type { ScreenScrollableProps } from "./screen.types";
import { screenVariants } from "./screen.variants";
import { resolveListComponent } from "./screen-list-component";
import { useScreenScrollInsets } from "./use-screen-scroll-insets";

// `Animated.createAnimatedComponent` erases the generic parameters; the recast
// puts them back so `data` and `renderItem` still check against each other.
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

export type ScreenFlatListProps<ItemT> = Omit<FlatListProps<ItemT>, "children"> &
	ScreenScrollableProps & {
		/**
		 * The list itself, for `scrollToIndex`, `scrollToOffset` and the rest.
		 *
		 * Declared rather than inherited, the same way `Screen.LegendList` declares
		 * its own: this component takes its props by name, so a `ref` passed
		 * through as one is invisible to a caller until the type says so.
		 */
		ref?: Ref<FlatList<ItemT>>;
	};

/**
 * A virtualised list that keeps its content clear of the screen's chrome.
 *
 * The reserves ride on `ListHeaderComponent` / `ListFooterComponent` rather
 * than on the content container's padding, because a virtualised list measures
 * its own content and a padded container would put the spacer outside what it
 * measures.
 *
 * A caller's own header and footer components still render — they are composed
 * inside the screen's, not replaced by them.
 */
export function ScreenFlatList<ItemT>({
	header,
	contentContainerClassName,
	ListHeaderComponent: ListHeaderComponentProp,
	ListFooterComponent: ListFooterComponentProp,
	...props
}: ScreenFlatListProps<ItemT>): ReactElement {
	const { scrollHandler, insetTopAnimatedStyle, insetBottomAnimatedStyle } = useScreenScrollInsets("standard");

	const ListHeaderComponent = useMemo<ReactElement>(
		() => (
			<>
				<Animated.View style={insetTopAnimatedStyle} />
				{header}
				{resolveListComponent(ListHeaderComponentProp)}
			</>
		),
		[header, ListHeaderComponentProp, insetTopAnimatedStyle]
	);

	const ListFooterComponent = useMemo<ReactElement>(
		() => (
			<View>
				{resolveListComponent(ListFooterComponentProp)}
				<Animated.View style={insetBottomAnimatedStyle} />
			</View>
		),
		[ListFooterComponentProp, insetBottomAnimatedStyle]
	);

	return (
		<AnimatedFlatList
			showsVerticalScrollIndicator={false}
			{...props}
			contentContainerClassName={cn(screenVariants().scrollContent(), contentContainerClassName)}
			ListFooterComponent={ListFooterComponent}
			ListHeaderComponent={ListHeaderComponent}
			onScroll={scrollHandler}
		/>
	);
}
ScreenFlatList.displayName = "DelacourUI.Screen.FlatList";
