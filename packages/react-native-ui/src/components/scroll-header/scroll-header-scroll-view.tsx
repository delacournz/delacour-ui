import { forwardRef, type ReactElement, type Ref, useMemo } from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { composeRefs } from "../../lib/compose-refs";
import type { ScrollHeaderScrollableProps } from "./scroll-header.types";
import { ScrollHeaderInset } from "./scroll-header-inset";
import { useScrollHeaderScrollProps } from "./use-scroll-header-scroll-props";

export type ScrollHeaderScrollViewProps = Omit<ScrollViewProps, "onScroll"> & ScrollHeaderScrollableProps;

/**
 * A scroll view wired to the header: its scroll drives the collapse and the snap, and its
 * content starts with `ScrollHeader.Inset`, so the first row rests under the Large block.
 *
 * The caller's `onScroll`, `onLayout` and `ref` still work — composed with the header's, never
 * replaced. For a short page, `contentContainerStyle={{ flexGrow: 1 }}` keeps it filling the
 * screen; the header stays open when nothing scrolls.
 */
export const ScrollHeaderScrollView = forwardRef<ScrollView, ScrollHeaderScrollViewProps>(
	function ScrollHeaderScrollViewRender(
		{ onScroll, onLayout, onContentSizeChange, children, className, contentContainerClassName, ...props },
		ref
	): ReactElement {
		const scrollProps = useScrollHeaderScrollProps("ScrollHeader.ScrollView", onScroll);
		// The animated ref is a callback ref underneath, and the instance React hands a callback
		// ref here is the one Reanimated would have handed it; the cast only restates that.
		const composedRef = useMemo(
			() => composeRefs<ScrollView>(scrollProps.ref as unknown as Ref<ScrollView>, ref),
			[scrollProps.ref, ref]
		);

		return (
			<Animated.ScrollView
				className={className}
				contentContainerClassName={contentContainerClassName}
				scrollEventThrottle={scrollProps.scrollEventThrottle}
				showsVerticalScrollIndicator={false}
				{...props}
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
			>
				<ScrollHeaderInset />
				{children}
			</Animated.ScrollView>
		);
	}
);
ScrollHeaderScrollView.displayName = "DelacourUI.ScrollHeader.ScrollView";
