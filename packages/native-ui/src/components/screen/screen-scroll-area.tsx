import type { ReactElement } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/cn";
import type { ScreenScrollableProps } from "./screen.types";
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

	const Scroll = keyboardAware ? StyledKeyboardAwareScrollView : Animated.ScrollView;

	return (
		<Scroll
			className={className}
			keyboardShouldPersistTaps="handled"
			onScroll={scrollHandler}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			{...(keyboardAware ? { bottomOffset: footerClearance } : null)}
			{...props}
			contentContainerClassName={cn(screenVariants().scrollContent({ className: "py-0" }), contentContainerClassName)}
		>
			<Animated.View style={insetTopAnimatedStyle} />
			{header}
			{children}
			<Animated.View style={insetBottomAnimatedStyle} />
		</Scroll>
	);
}
