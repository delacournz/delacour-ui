import type { Component, ComponentType, DependencyList, EffectCallback, ReactElement, Ref, RefAttributes } from "react";
import type { FlatList, FlatListProps, ScrollView, ScrollViewProps, SectionList, SectionListProps } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";

/**
 * The list a scrollable registers with its sheet. Kept for identity — the
 * lock scrolls it through Reanimated's own animated ref — so the constraint is
 * only that it is a component instance.
 */
export type ScrollableHandle = Component;

/**
 * The hook that runs the registration effect.
 *
 * `useEffect` registers on mount. Under React Navigation `useFocusEffect` has
 * the same shape and registers when the screen gains focus, so two screens in
 * a stack, each with a list in the same sheet, hand the sheet the one that is
 * showing.
 */
export type FocusHook = (effect: EffectCallback, deps?: DependencyList) => void;

/** What every `createBottomSheetScrollable` component adds on top of the list's own props. */
export type BottomSheetScrollableProps = {
	/** @default useEffect */
	focusHook?: FocusHook;
};

/**
 * The props the wrapper itself reads or writes, and that every React Native
 * scrollable has. The generic list's remaining props pass through untouched.
 */
export type ScrollableInnerProps = Omit<ScrollViewProps, "style"> & {
	ref?: Ref<ScrollableHandle>;
	style?: AnimatedProps<ScrollViewProps>["style"];
	animatedProps?: Partial<ScrollViewProps>;
};

/** The animated list a factory wraps — `Animated.ScrollView`, `Animated.FlatList`, or one made with `createAnimatedComponent`. */
export type ScrollableInnerComponent = ComponentType<ScrollableInnerProps>;

export type BottomSheetScrollViewProps = ScrollViewProps &
	BottomSheetScrollableProps & {
		ref?: Ref<ScrollView>;
	};

export type BottomSheetFlatListProps<ItemT> = Omit<FlatListProps<ItemT>, "children"> & BottomSheetScrollableProps;

export type BottomSheetSectionListProps<ItemT, SectionT> = Omit<SectionListProps<ItemT, SectionT>, "children"> &
	BottomSheetScrollableProps;

/**
 * The generic component types, restated so `<ItemT>` survives the factory.
 *
 * `createBottomSheetScrollable` returns one concrete component, so `data` and
 * `renderItem` would check against `unknown` and stop constraining each
 * other. Writing the signature out is the same move
 * `@delacour/react-native-ui`'s `Screen.FlatList` makes, and the `displayName`
 * member is what keeps the trailing assignment legal after the cast.
 */
export type BottomSheetFlatListComponent = (<ItemT>(
	props: BottomSheetFlatListProps<ItemT> & RefAttributes<FlatList<ItemT>>
) => ReactElement) & { displayName?: string };

export type BottomSheetSectionListComponent = (<ItemT, SectionT>(
	props: BottomSheetSectionListProps<ItemT, SectionT> & RefAttributes<SectionList<ItemT, SectionT>>
) => ReactElement) & { displayName?: string };

export type BottomSheetScrollViewComponent = ((props: BottomSheetScrollViewProps) => ReactElement) & {
	displayName?: string;
};
