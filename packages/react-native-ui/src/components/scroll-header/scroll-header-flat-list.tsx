import {
	type ComponentType,
	type ForwardedRef,
	forwardRef,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	type RefAttributes,
	useMemo,
} from "react";
import { FlatList, type FlatListProps } from "react-native";
import Animated from "react-native-reanimated";
import { composeRefs } from "../../lib/compose-refs";
import type { ScrollHeaderScrollableProps } from "./scroll-header.types";
import { ScrollHeaderInset } from "./scroll-header-inset";
import { useScrollHeaderScrollProps } from "./use-scroll-header-scroll-props";

// `Animated.createAnimatedComponent` erases the generic parameters; the recast
// puts them back so `data` and `renderItem` still check against each other.
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

export type ScrollHeaderFlatListProps<ItemT> = Omit<FlatListProps<ItemT>, "onScroll"> & ScrollHeaderScrollableProps;

/**
 * The caller's `ListHeaderComponent` as a node, whichever form it took — an element, or a
 * component type rendered as an element (calling it as a function would break its hooks).
 */
function renderListHeader(header: FlatListProps<unknown>["ListHeaderComponent"]): ReactNode {
	if (header == null) return null;
	if (isValidElement(header)) return header;
	const Header = header as ComponentType<unknown>;
	return <Header />;
}

/**
 * The component's own type, restated so `<ItemT>` survives `forwardRef` — the same move
 * `Screen.FlatList` makes, and the `displayName` member keeps the trailing assignment legal.
 */
type ScrollHeaderFlatListComponent = (<ItemT>(
	props: ScrollHeaderFlatListProps<ItemT> & RefAttributes<FlatList<ItemT>>
) => ReactElement) & { displayName?: string };

/**
 * A virtualised list wired to the header.
 *
 * The inset rides on `ListHeaderComponent`, ahead of the caller's own, rather than on the
 * content container's padding: a virtualised list measures its own content, and padding would
 * sit outside what it measures.
 */
export const ScrollHeaderFlatList = forwardRef(function ScrollHeaderFlatListRender<ItemT>(
	{
		onScroll,
		onLayout,
		onContentSizeChange,
		ListHeaderComponent: CallerHeader,
		...props
	}: ScrollHeaderFlatListProps<ItemT>,
	ref: ForwardedRef<FlatList<ItemT>>
): ReactElement {
	const scrollProps = useScrollHeaderScrollProps("ScrollHeader.FlatList", onScroll);
	// The animated ref is a callback ref underneath, and the instance React hands a callback
	// ref here is the one Reanimated would have handed it; the cast only restates that.
	const composedRef = useMemo(
		() => composeRefs<FlatList<ItemT>>(scrollProps.ref as unknown as Ref<FlatList<ItemT>>, ref),
		[scrollProps.ref, ref]
	);

	const ListHeaderComponent = useMemo<ReactElement>(() => {
		return (
			<>
				<ScrollHeaderInset />
				{renderListHeader(CallerHeader)}
			</>
		);
	}, [CallerHeader]);

	return (
		<AnimatedFlatList
			scrollEventThrottle={scrollProps.scrollEventThrottle}
			showsVerticalScrollIndicator={false}
			{...props}
			ListHeaderComponent={ListHeaderComponent}
			onContentSizeChange={(width, height) => {
				scrollProps.onContentSizeChange(width, height);
				onContentSizeChange?.(width, height);
			}}
			onLayout={(event) => {
				scrollProps.onLayout(event);
				onLayout?.(event);
			}}
			onScroll={scrollProps.onScroll}
			ref={composedRef}
		/>
	);
}) as unknown as ScrollHeaderFlatListComponent;
ScrollHeaderFlatList.displayName = "DelacourUI.ScrollHeader.FlatList";
