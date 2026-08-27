import type { LegendListRef } from "@legendapp/list/react-native";
import { AnimatedLegendList, type AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { type ReactElement, type Ref, useMemo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { cn } from "@registry/lib/cn";
import type { ScreenScrollableProps } from "./screen.types";
import { screenVariants } from "./screen.variants";
import { resolveListComponent } from "./screen-list-component";
import { useScreenScrollInsets } from "./use-screen-scroll-insets";

/**
 * The class props `withUniwind` adds, restated so the generic survives.
 *
 * `withUniwind`'s own return type maps over a component's props and collapses
 * `<ItemT>` in the process, which would leave `data` and `renderItem` checking
 * against `unknown`. Writing the signature out keeps inference and still
 * declares exactly the two props the wrapper adds.
 */
type StyledAnimatedLegendListComponent = <ItemT>(
	props: AnimatedLegendListProps<ItemT> & {
		ref?: Ref<LegendListRef>;
		className?: string;
		contentContainerClassName?: string;
	}
) => ReactElement | null;

// Third-party, so `className` needs the wrapper — and it has to be built at
// module scope or every render mints a new component type and remounts the list.
const StyledAnimatedLegendList = withUniwind(AnimatedLegendList) as unknown as StyledAnimatedLegendListComponent;

export type ScreenLegendListProps<ItemT> = Omit<AnimatedLegendListProps<ItemT>, "renderScrollComponent"> &
	ScreenScrollableProps & {
		ref?: Ref<LegendListRef>;
	};

/**
 * A recycling list that keeps its content clear of the screen's chrome.
 *
 * `Screen.FlatList`'s behaviour on LegendList's recycling engine, for a long or
 * heterogeneous list. Same navbar, footer and keyboard reserves — they come
 * from the shared `useScreenScrollInsets`, so the three lists cannot drift.
 *
 * For a chat, reach for `Screen.ChatList` instead: it adds the composer
 * clearance and the keyboard lift that a conversation needs and this one has no
 * opinion about.
 */
export function ScreenLegendList<ItemT>({
	header,
	contentContainerClassName,
	ListHeaderComponent: ListHeaderComponentProp,
	ListFooterComponent: ListFooterComponentProp,
	...props
}: ScreenLegendListProps<ItemT>): ReactElement {
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
		<StyledAnimatedLegendList
			showsVerticalScrollIndicator={false}
			{...(props as AnimatedLegendListProps<ItemT>)}
			contentContainerClassName={cn(screenVariants().scrollContent(), contentContainerClassName)}
			ListFooterComponent={ListFooterComponent}
			ListHeaderComponent={ListHeaderComponent}
			onScroll={scrollHandler}
		/>
	);
}
ScreenLegendList.displayName = "DelacourUI.Screen.LegendList";
