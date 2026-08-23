import "../styles/global.css";
import { DelacourProvider } from "@delacour/native-ui/provider";
import { Stack } from "expo-router";

/**
 * The global.css import must stay the first statement, and must live here
 * rather than in the registered root entry — importing it from index.ts breaks
 * Uniwind's hot reload and forces a full reload on every edit.
 *
 * DelacourProvider is @delacour/native-ui's whole root stack: the gesture root
 * every Pressable needs above it, the safe-area provider seeded with
 * initialWindowMetrics so the first frame is not blank, the keyboard provider
 * Screen reads to move its footer, and the KeyboardStateSync that repairs the
 * one pair of animation values that provider shares with the whole app.
 *
 * Deliberately mounted with no props: the defaults are what a consuming app
 * gets, so a regression in one of them shows up here first.
 */
export default function RootLayout() {
	return (
		<DelacourProvider>
			<Stack screenOptions={{ headerShown: false }} />
		</DelacourProvider>
	);
}
