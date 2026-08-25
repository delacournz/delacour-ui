import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, type Metrics, SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardStateSync } from "../../hooks/use-keyboard-state-sync";

export type DelacourProviderProps = {
	children: ReactNode;
	/**
	 * Safe-area insets and frame to render the first frame against, before the
	 * native provider has measured anything.
	 *
	 * Defaults to `initialWindowMetrics`, the snapshot the native module captured
	 * at launch, because `SafeAreaProvider` renders NOTHING — not unstyled
	 * children, `null` — until its first `onInsetsChange` lands. Without a seed
	 * every cold start shows a blank frame.
	 *
	 * Pass `null` to opt out. A default parameter only fires on `undefined`, so
	 * `null` is a value here rather than an absence.
	 */
	initialMetrics?: Metrics | null;
	/**
	 * Style for the outermost `GestureHandlerRootView`.
	 *
	 * Forwarded untouched, with no default merged in: the gesture root applies
	 * its own `{ flex: 1 }` whenever `style` is undefined. Pass one and that
	 * default is gone, so include `flex: 1` unless the root genuinely should not
	 * fill the window.
	 */
	style?: StyleProp<ViewStyle>;
};

/**
 * Every provider this library needs at an app's root, in one component.
 *
 * Mount it ONCE, around everything — a root layout, an `App.tsx`. It is not
 * idempotent and does not detect an enclosing copy of itself; see AGENTS.md.
 *
 * Five layers, outermost first, and the order is not stylistic:
 *
 * 1. `GestureHandlerRootView` — an ancestor native view every gesture handler
 *    `Pressable` creates has to attach to. Its absence is silent: no error, no
 *    warning, presses simply stop landing.
 * 2. `SafeAreaProvider` — the insets `Screen`'s navbar, footer and scroll
 *    reserves are all computed from, seeded so the first frame is not blank.
 * 3. `KeyboardProvider` — the shared animation values `Screen.Footer` rides.
 * 4. `KeyboardStateSync` — a child of the keyboard provider, because it calls
 *    `useKeyboardContext()`. It repairs the one pair of animation values that
 *    provider shares with the whole app: on iOS they are written only from the
 *    `will` events, so a keyboard that vanishes without one — an interactive
 *    dismiss interrupted by navigation, a stack pop, an app suspend — leaves
 *    every screen in the app believing it is still open.
 * 5. `BottomSheetModalProvider` — the host every `BottomSheet` portals into. It
 *    goes innermost because it draws ABOVE the app and reads every layer over
 *    it: the gesture root for the pan, the safe area for its insets, and the
 *    keyboard values a sheet's footer rides. It wraps `{children}` and nothing
 *    else moves, which is what a new layer here always looks like.
 *
 * `KeyboardStateSync` stays a SIBLING of it rather than a child. The repair is
 * global and has to run for the whole app's lifetime; inside a layer that can
 * remount it would be torn down with it.
 *
 * There are no per-layer escape hatches and no layer-named props on purpose.
 * An app that needs a different stack composes the providers by hand; they are
 * all public from their own packages, and this is a convenience, not a gate.
 *
 * @example
 * // expo-router root layout. The css import must stay the first statement.
 * import "../styles/global.css";
 * import { DelacourProvider } from "@delacour/native-ui/provider";
 * import { Stack } from "expo-router";
 *
 * export default function RootLayout() {
 *   return (
 *     <DelacourProvider>
 *       <Stack screenOptions={{ headerShown: false }} />
 *     </DelacourProvider>
 *   );
 * }
 *
 * @example
 * // Measure the safe area from scratch, accepting the blank first frame — an
 * // app that launches into a rotated or split-screen window and cannot
 * // tolerate one stale frame.
 * <DelacourProvider initialMetrics={null}>{children}</DelacourProvider>
 */
export function DelacourProvider({
	children,
	initialMetrics = initialWindowMetrics,
	style,
}: DelacourProviderProps): ReactElement {
	return (
		<GestureHandlerRootView style={style}>
			<SafeAreaProvider initialMetrics={initialMetrics}>
				<KeyboardProvider>
					<KeyboardStateSync />
					<BottomSheetModalProvider>{children}</BottomSheetModalProvider>
				</KeyboardProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
DelacourProvider.displayName = "DelacourUI.Provider";
