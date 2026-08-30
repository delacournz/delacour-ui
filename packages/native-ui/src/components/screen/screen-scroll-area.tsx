import type { ReactElement, Ref } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/cn";
import type { ScreenScrollableProps, ScreenScrollViewRef } from "./screen.types";
import { screenVariants } from "./screen.variants";
import { useScreenFooterKeyboardClearance, useScreenScrollInsets } from "./use-screen-scroll-insets";

// `contentContainerClassName` only resolves on a uniwind-wrapped component, and
// the wrapper has to be built at module scope — in render it would mint a new
// component type every frame and remount the whole scroll view.
const StyledKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

export type ScreenScrollAreaProps = ScrollViewProps &
	ScreenScrollableProps & {
		/**
		 * Scroll the focused `TextInput` clear of the keyboard, rather than only
		 * reserving space for it. Turn this on for form screens. Off by default —
		 * it costs a second scroll driver that a read-only screen never needs.
		 */
		keyboardAware?: boolean;
		/**
		 * The scroll view itself, for a caller that has to move it — jumping to an
		 * offset, or driving it from a gesture on the UI thread.
		 *
		 * Declared rather than inherited. This component takes its props by name,
		 * so React 19 passing `ref` through as one of them is invisible to a caller
		 * until the type says so; `Screen.LegendList` declares its own for exactly
		 * the same reason.
		 *
		 * One type covers both engines. `keyboardAware` swaps in
		 * `KeyboardAwareScrollView`, whose ref is a SUPERSET of this one — it adds
		 * `assureFocusedInputVisible` to the same scroll view instance — so what a
		 * caller receives always satisfies what it declared.
		 */
		ref?: Ref<ScreenScrollViewRef>;
	};

/**
 * A scrolling region that keeps its content clear of the screen's chrome.
 *
 * The navbar and footer reserves are spacer views at either end of the content
 * rather than padding on the content container, so both can animate on the UI
 * thread as the chrome measures itself and the keyboard moves.
 *
 * @example
 * <Screen.ScrollArea contentContainerClassName="gap-4 px-5">
 *   {rows}
 * </Screen.ScrollArea>
 *
 * @example
 * <Screen.ScrollArea keyboardAware contentContainerClassName="gap-4 px-5">
 *   <Form />
 * </Screen.ScrollArea>
 */
export function ScreenScrollArea({
	header,
	className,
	contentContainerClassName,
	keyboardAware = false,
	ref,
	children,
	...props
}: ScreenScrollAreaProps): ReactElement {
	const { scrollHandler, insetTopAnimatedStyle, insetBottomAnimatedStyle } = useScreenScrollInsets(
		keyboardAware ? "keyboard-aware" : "standard"
	);
	// A sticky footer rides the keyboard, so the focused field has to clear the
	// footer too — not just the keyboard. Deliberately not the chat list's
	// occupancy: the footer's safe-area band is parked behind the keyboard by the
	// sticky shift, so counting it here would overshoot.
	const footerClearance = useScreenFooterKeyboardClearance();

	const content = (
		<>
			<Animated.View style={insetTopAnimatedStyle} />
			{header}
			{children}
			<Animated.View style={insetBottomAnimatedStyle} />
		</>
	);
	const contentContainer = cn(screenVariants().scrollContent({ className: "py-0" }), contentContainerClassName);

	// Two branches rather than one `keyboardAware ? A : B` component variable.
	// A variable holding either component types its `ref` as the two refs'
	// intersection, which is neither of them, so declaring the prop above would
	// not compile at all — and the branch is what lets each engine receive the
	// ref that is actually its own.
	//
	// The cast in that branch is variance, not a guess: `RefObject.current` is
	// mutable and therefore invariant, so TypeScript rejects the narrower ref
	// even though the value flowing back into it is a `KeyboardAwareScrollViewRef`
	// — which IS a `ScreenScrollViewRef` plus one method.
	if (keyboardAware) {
		return (
			<StyledKeyboardAwareScrollView
				className={className}
				keyboardShouldPersistTaps="handled"
				onScroll={scrollHandler}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				bottomOffset={footerClearance}
				{...props}
				ref={ref as Ref<KeyboardAwareScrollViewRef>}
				contentContainerClassName={contentContainer}
			>
				{content}
			</StyledKeyboardAwareScrollView>
		);
	}

	return (
		<Animated.ScrollView
			className={className}
			keyboardShouldPersistTaps="handled"
			onScroll={scrollHandler}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			{...props}
			ref={ref}
			contentContainerClassName={contentContainer}
		>
			{content}
		</Animated.ScrollView>
	);
}
ScreenScrollArea.displayName = "DelacourUI.Screen.ScrollArea";
