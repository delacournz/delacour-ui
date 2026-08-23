import { type ReactElement, useMemo } from "react";
import { type DefaultSectionT, SectionList, type SectionListProps, View } from "react-native";
import Animated from "react-native-reanimated";
import type { ScreenScrollableProps } from "./screen.types";
import { resolveListComponent } from "./screen-list-component";
import { useScreenScrollInsets } from "./use-screen-scroll-insets";

// `Animated.createAnimatedComponent` erases the generic parameters; the recast
// puts them back so `sections` and `renderItem` still check against each other.
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList) as unknown as typeof SectionList;

export type ScreenSectionListProps<ItemT, SectionT = DefaultSectionT> = Omit<
	SectionListProps<ItemT, SectionT>,
	"children"
> &
	ScreenScrollableProps;

/**
 * A sectioned virtualised list that keeps its content clear of the screen's
 * chrome. `Screen.FlatList`'s behaviour, with sticky section headers.
 */
export function ScreenSectionList<ItemT, SectionT = DefaultSectionT>({
	header,
	ListHeaderComponent: ListHeaderComponentProp,
	ListFooterComponent: ListFooterComponentProp,
	...props
}: ScreenSectionListProps<ItemT, SectionT>): ReactElement {
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
		<AnimatedSectionList
			showsVerticalScrollIndicator={false}
			{...props}
			ListFooterComponent={ListFooterComponent}
			ListHeaderComponent={ListHeaderComponent}
			onScroll={scrollHandler}
		/>
	);
}
