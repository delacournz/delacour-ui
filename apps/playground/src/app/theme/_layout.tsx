import { Screen } from "@delacour/native-ui/screen";
import { useRouter } from "expo-router";
import { TopTabs } from "expo-router/js-top-tabs";
import type { ReactElement } from "react";
import { View } from "react-native";
import { renderThemeTabBar, ThemeTabBarProvider } from "@/components/theme/theme-tab-bar";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * `/theme`, as two tabs that can be swiped between.
 *
 * **`expo-router/js-top-tabs`, not `@react-navigation/material-top-tabs`.**
 * SDK 56 vendored the navigator into expo-router and pre-wrapped it in
 * `withLayoutContext`, so the two files beside this one become the two tabs and
 * each keeps a real URL. Installing the React Navigation package instead does
 * not merely duplicate it — expo-router refuses to bundle while
 * `@react-navigation/*` resolves.
 *
 * Choosing a look and seeing it applied are two halves of one job that do not
 * fit on one screen — the axes alone fill a viewport and a half, so the preview
 * was always below the fold and never beside the control that changed it. Two
 * tabs put them a swipe apart instead of a scroll.
 *
 * The navbar is the only chrome that takes space here. The tab bar floats over
 * the pager and measures itself, and each tab opens with a `ThemeTabBarSpacer`
 * that gives the room back — so a page scrolls under the bar rather than
 * beginning below it. `ThemeTabBarProvider` is what carries that height between
 * two things the navigator renders as siblings.
 */
export default function ThemeLayout(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar actions={<ThemeToggle />} placement="static">
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Theme</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>8 axes</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<ThemeTabBarProvider>
				<TopTabs tabBar={renderThemeTabBar}>
					<TopTabs.Screen name="index" options={{ title: "Design" }} />
					<TopTabs.Screen name="preview" options={{ title: "Preview" }} />
				</TopTabs>
			</ThemeTabBarProvider>
		</Screen>
	);
}
