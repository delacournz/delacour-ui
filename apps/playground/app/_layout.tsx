import "../src/styles/global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * The global.css import must stay the first statement, and must live here
 * rather than in the registered root entry — importing it from index.ts breaks
 * Uniwind's hot reload and forces a full reload on every edit.
 *
 * GestureHandlerRootView has to be the outermost wrapper for the Gesture API
 * that @delacour/native-ui's Pressable is built on.
 */
export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<Stack screenOptions={{ headerShown: false }} />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
