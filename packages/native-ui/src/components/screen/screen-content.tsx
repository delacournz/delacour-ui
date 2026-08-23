import type { ReactElement } from "react";
import { View } from "react-native";
import { KeyboardGestureArea } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInsetProps } from "./screen.types";
import { resolveScreenEdgePadding, screenVariants } from "./screen.variants";

/**
 * The `nativeID` linking a chat composer's `TextInput` to `Screen.Content`'s
 * gesture area.
 *
 * iOS applies the interactive-dismiss offset only to a focused input whose
 * `nativeID` matches the gesture area's, so both ends have to agree on one
 * string. Exported rather than left to each screen to invent.
 */
export const SCREEN_CHAT_INPUT_NATIVE_ID = "screen-chat-input";

export type ScreenContentProps = ScreenInsetProps & {
	/**
	 * Links the keyboard gesture area to a `TextInput` with this `nativeID`, so
	 * dragging the keyboard down carries the input with it. Pass
	 * {@link SCREEN_CHAT_INPUT_NATIVE_ID} on both ends for a chat composer.
	 */
	textInputNativeID?: string;
};

/**
 * A screen's content region: the keyboard gesture area plus a surface.
 *
 * The gesture area is what makes a downward drag on the keyboard dismiss it
 * interactively rather than only on a tap. It takes an inline `flex: 1` rather
 * than a class — it is a third-party component, so a `className` would need a
 * `withUniwind` wrapper, and AGENTS.md rule 6 keeps that budget for components
 * that genuinely need styling rather than a single flex value.
 *
 * No edges are inset by default: a screen with an overlay navbar wants its
 * content to run under the notch, and only the caller knows which edges matter.
 *
 * @example
 * <Screen.Content insets={["bottom"]}>
 *   <Screen.ScrollArea>{rows}</Screen.ScrollArea>
 * </Screen.Content>
 */
export function ScreenContent({
	insets,
	className,
	textInputNativeID,
	children,
	style,
	...props
}: ScreenContentProps): ReactElement {
	const safeArea = useSafeAreaInsets();

	return (
		<KeyboardGestureArea interpolator="ios" style={{ flex: 1 }} textInputNativeID={textInputNativeID}>
			<View
				className={screenVariants().content({ className })}
				style={[resolveScreenEdgePadding(insets, safeArea), style]}
				{...props}
			>
				{children}
			</View>
		</KeyboardGestureArea>
	);
}
