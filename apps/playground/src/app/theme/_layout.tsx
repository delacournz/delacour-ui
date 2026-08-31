import { Screen } from "@delacour/native-ui/screen";
import { Tabs } from "@delacour/native-ui/tabs";
import { useRouter } from "expo-router";
import { TopTabs } from "expo-router/js-top-tabs";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * What the navigator hands a `tabBar`, restated.
 *
 * Its own `MaterialTopTabBarProps` is declared `any & { … }`, and an
 * intersection with `any` collapses to `any` — so importing it would type this
 * component as nothing at all and every callback below would be an implicit
 * any. Naming the three fields actually read is both narrower than the alias
 * and the only version of it that checks.
 */
type ThemeTabBarProps = {
	state: { index: number; routes: readonly { key: string; name: string }[] };
	descriptors: Record<string, { options: { title?: string } } | undefined>;
	navigation: {
		emit: (event: { canPreventDefault: true; target: string; type: "tabPress" }) => { defaultPrevented: boolean };
		navigate: (name: string) => void;
	};
};

/**
 * The bar, drawn with the library's own `Tabs` rather than the navigator's.
 *
 * `tabBar` replaces the material bar wholesale, so what is on screen is the
 * component this app exists to show off — the measured indicator, the press
 * feedback, the token-driven track — while the navigator keeps the parts it is
 * better at: the pager, the routes, and the URL.
 *
 * `isSwipeable={false}` because the pager underneath already owns the
 * horizontal gesture. Left on, two things would claim the same drag and the
 * indicator would fight the panels it is supposed to follow.
 *
 * `tabPress` is emitted before navigating because that is the navigator's
 * contract — a screen can cancel it — and it is what keeps a re-press of the
 * focused tab from re-entering it.
 */
function ThemeTabBar({ state, descriptors, navigation }: ThemeTabBarProps): ReactElement {
	const current = state.routes[state.index]?.name ?? null;

	const select = (name: string) => {
		const route = state.routes.find((candidate) => candidate.name === name);
		if (!route || route.name === current) return;

		const event = navigation.emit({ canPreventDefault: true, target: route.key, type: "tabPress" });
		if (event.defaultPrevented) return;

		navigation.navigate(route.name);
	};

	return (
		<View className="px-screen-gutter pb-3">
			<Tabs isSwipeable={false} onValueChange={select} value={current}>
				<Tabs.List>
					<Tabs.Indicator />
					{state.routes.map((route) => (
						<Tabs.Trigger key={route.key} testID={`theme-tab-${route.name}`} value={route.name}>
							<Tabs.Label>{descriptors[route.key]?.options.title ?? route.name}</Tabs.Label>
						</Tabs.Trigger>
					))}
				</Tabs.List>
			</Tabs>
		</View>
	);
}
ThemeTabBar.displayName = "Playground.ThemeTabBar";

/**
 * `/theme`, as two tabs that can be swiped between.
 *
 * **`expo-router/js-top-tabs`, not `@react-navigation/material-top-tabs`.**
 * SDK 56 vendored the navigator into expo-router and pre-wrapped it in
 * `withLayoutContext`, so the two files beside this one become the two tabs and
 * each keeps a real URL — with no third-party navigator to install and, because
 * the vendored pager is JavaScript rather than `react-native-pager-view`, no
 * native module and no rebuild.
 *
 * The chrome lives here rather than in either tab: one navbar and one bar, both
 * outside the pager, so neither moves when a page slides under them. Each tab
 * owns only its own scroll area.
 *
 * Choosing a look and seeing it applied are two halves of one job that do not
 * fit on one screen — the axes alone fill a viewport and a half, so the preview
 * was always below the fold and never beside the control that changed it. Two
 * tabs put them a swipe apart instead of a scroll.
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

			<TopTabs tabBar={ThemeTabBar}>
				<TopTabs.Screen name="index" options={{ title: "Design" }} />
				<TopTabs.Screen name="preview" options={{ title: "Preview" }} />
			</TopTabs>
		</Screen>
	);
}
