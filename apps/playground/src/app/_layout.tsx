import "../styles/global.css";
import { NavigationTheme } from "@delacour/native-ui/expo/navigation-theme";
import { useThemeColor } from "@delacour/native-ui/hooks/use-theme-color";
import { DelacourProvider } from "@delacour/native-ui/provider";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { ThemeTrigger } from "@/components/theme/theme-trigger";
import { restoreDesignSystem } from "@/design-system/store";

/**
 * The stored design system, applied before anything renders.
 *
 * At module scope, not in an effect: MMKV reads synchronously, so the restored
 * palette, geometry and typeface are already in Uniwind's variable store for
 * the first paint. In an effect this would render one frame of the library's
 * own look and then repaint, on every cold start. It runs after the global.css
 * import above, which is what registers the themes it writes into.
 */
restoreDesignSystem();

/**
 * Paints the native root view — the layer beneath the whole React tree.
 *
 * `app.config.ts` can only carry one static `backgroundColor`, so it cannot
 * follow a theme the user changes at runtime. This does, keyed on the same
 * token every screen paints itself with.
 *
 * It is a belt to `NavigationTheme`'s braces: that fixes the layer between
 * cards, this fixes anything further back — a bounce past the end of a modal,
 * or the moment before the first screen mounts.
 */
function SystemBackground(): null {
	const background = useThemeColor("background");

	useEffect(() => {
		if (!background) return;
		void SystemUI.setBackgroundColorAsync(background);
	}, [background]);

	return null;
}

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
 * NavigationTheme hands the navigator the same tokens, which is what keeps the
 * container behind a screen transition from being React Navigation's own pale
 * default.
 *
 * Deliberately mounted with no props: the defaults are what a consuming app
 * gets, so a regression in one of them shows up here first.
 */
export default function RootLayout() {
	return (
		<DelacourProvider>
			<SystemBackground />
			<NavigationTheme>
				<Stack screenOptions={{ headerShown: false }} />
				<ThemeTrigger />
			</NavigationTheme>
		</DelacourProvider>
	);
}
