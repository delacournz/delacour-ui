import "../styles/global.css";
import { KeyboardStateSync } from "@delacour/native-ui/hooks/use-keyboard-state-sync";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * The global.css import must stay the first statement, and must live here
 * rather than in the registered root entry — importing it from index.ts breaks
 * Uniwind's hot reload and forces a full reload on every edit.
 *
 * GestureHandlerRootView has to be the outermost wrapper for the Gesture API
 * that @delacour/native-ui's Pressable is built on.
 *
 * KeyboardProvider is what @delacour/native-ui's Screen reads to move its
 * footer with the keyboard. KeyboardStateSync sits directly inside it and
 * repairs the one pair of animation values the provider shares with the whole
 * app: on iOS they are written only from the `will` events, so a keyboard that
 * disappears without one — an interactive dismiss interrupted by navigation, a
 * stack pop, an app suspend — leaves every screen believing it is still open.
 */
export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<KeyboardProvider>
					<KeyboardStateSync />
					<Stack screenOptions={{ headerShown: false }} />
				</KeyboardProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
