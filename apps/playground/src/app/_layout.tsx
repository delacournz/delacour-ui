import "../styles/global.css";
import { useNavigationTheme } from "@delacour/native-ui/hooks/use-navigation-theme";
import { useThemeColor } from "@delacour/native-ui/hooks/use-theme-color";
import { DelacourProvider } from "@delacour/native-ui/provider";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { type ReactElement, type ReactNode, useEffect, useMemo } from "react";

/**
 * Hands the navigator the app's own theme colours.
 *
 * Not decoration. `expo-router` mounts its `NavigationContainer` with no
 * `theme`, so React Navigation's light default stands however dark the app is,
 * and on iOS the native stack paints `colors.background` onto the
 * `UINavigationController`'s view — the slab visible between the cards during a
 * push, and at their rounded corners. That layer is hardcoded to the theme, so
 * a `contentStyle` in `screenOptions` cannot reach it.
 *
 * `ThemeProvider` comes from `expo-router`, which vendors React Navigation:
 * `@react-navigation/native` is not installed and does not resolve.
 *
 * The framework's own base theme is spread underneath rather than replaced,
 * because `ReactNavigation.Theme` also carries `fonts`, whose shape is
 * platform-specific — restating it here would be a second definition able to
 * drift from the one React Navigation actually ships.
 *
 * Its own component so the re-render on a theme change stays below the
 * providers, which have no reason to remount when the palette swaps.
 */
function NavigationTheme({ children }: { children: ReactNode }): ReactElement {
	const { dark, colors } = useNavigationTheme();
	const base = dark ? DarkTheme : DefaultTheme;

	const value = useMemo(() => ({ ...base, colors: { ...base.colors, ...colors }, dark }), [base, colors, dark]);

	return <ThemeProvider value={value}>{children}</ThemeProvider>;
}

/**
 * Paints the native root view — the layer beneath the whole React tree.
 *
 * `app.config.ts` can only carry one static `backgroundColor`, so it cannot
 * follow a theme the user changes at runtime. This does, keyed on the same
 * token every screen paints itself with.
 *
 * It is a belt to the navigator theme's braces: that fixes the layer between
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
 * Deliberately mounted with no props: the defaults are what a consuming app
 * gets, so a regression in one of them shows up here first.
 */
export default function RootLayout() {
	return (
		<DelacourProvider>
			<SystemBackground />
			<NavigationTheme>
				<Stack screenOptions={{ headerShown: false }} />
			</NavigationTheme>
		</DelacourProvider>
	);
}
