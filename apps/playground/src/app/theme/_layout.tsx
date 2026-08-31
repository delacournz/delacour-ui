import { useThemeColor } from "@delacour/native-ui/hooks/use-theme-color";
import { Screen } from "@delacour/native-ui/screen";
import { Tabs } from "@delacour/native-ui/tabs";
import { useRouter } from "expo-router";
import { TopTabs, useTabAnimation } from "expo-router/js-top-tabs";
import { type ReactElement, useState } from "react";
import { Animated, type LayoutChangeEvent, View } from "react-native";
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
	/**
	 * The pager's live offset, in page units, as a React Native `Animated` node.
	 *
	 * Read as an animation *input* and never as a value. It is an
	 * `AnimatedAddition` driven by the native driver, and `addListener` on a
	 * derived native node never fires on Fabric — so nothing here can learn its
	 * number, but a style interpolated from it still moves natively, every frame,
	 * without JS. That is why the indicator below is React Native's `Animated`
	 * rather than the library's Reanimated one.
	 */
	position: Animated.AnimatedInterpolation<number>;
	descriptors: Record<string, { options: { title?: string } } | undefined>;
	navigation: {
		emit: (event: { canPreventDefault: true; target: string; type: "tabPress" }) => { defaultPrevented: boolean };
		navigate: (name: string) => void;
	};
};

/**
 * The capsule, tracking the pager rather than the selection.
 *
 * `Tabs.Indicator` is the library's own and it cannot be used here: it moves off
 * a Reanimated shared value, and the only thing that knows where this pager is
 * mid-drag is a React Native `Animated` node whose value no JS can read. So this
 * is that node, interpolated — the same `absolute inset-y-0 rounded-full
 * bg-elevated` the library's `primary` variant paints, written as a style
 * because an `Animated.View` takes no `className`.
 *
 * The width comes from measuring a trigger rather than dividing the row, so it
 * stays right if the two tabs are ever not equal.
 */
function TabIndicator({
	position,
	tabWidth,
}: {
	position: Animated.AnimatedInterpolation<number>;
	tabWidth: number;
}): ReactElement | null {
	const elevated = useThemeColor("elevated");

	if (tabWidth === 0) return null;

	return (
		<Animated.View
			pointerEvents="none"
			style={{
				backgroundColor: elevated,
				borderRadius: 9999,
				bottom: 0,
				position: "absolute",
				top: 0,
				transform: [{ translateX: Animated.multiply(position, tabWidth) }],
				width: tabWidth,
			}}
		/>
	);
}
TabIndicator.displayName = "Playground.ThemeTabBar.Indicator";

/**
 * The bar, drawn with the library's own `Tabs` rather than the navigator's.
 *
 * `tabBar` replaces the material bar wholesale, so what is on screen is the
 * component this app exists to show off — the triggers, their press feedback and
 * the token-driven track — while the navigator keeps the parts it is better at:
 * the pager, the routes, and the URL.
 *
 * The one part that is not the library's is the capsule, and the reason is in
 * `TabIndicator` above. `isSwipeable={false}` because the pager already owns the
 * horizontal gesture; left on, two things would claim the same drag.
 *
 * `tabPress` is emitted before navigating because that is the navigator's
 * contract — a screen can cancel it — and it is what keeps a re-press of the
 * focused tab from re-entering it.
 */
function ThemeTabBar({ state, descriptors, navigation, position }: ThemeTabBarProps): ReactElement {
	const current = state.routes[state.index]?.name ?? null;
	const [tabWidth, setTabWidth] = useState(0);

	const measure = (event: LayoutChangeEvent) => setTabWidth(event.nativeEvent.layout.width);

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
					<TabIndicator position={position} tabWidth={tabWidth} />
					{state.routes.map((route, index) => (
						<Tabs.Trigger
							key={route.key}
							onLayout={index === 0 ? measure : undefined}
							testID={`theme-tab-${route.name}`}
							value={route.name}
						>
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
 * Mounted as an element, never handed over as the callback itself.
 *
 * The navigator *calls* `tabBar(props)` rather than rendering `<TabBar />`, so a
 * function passed straight in runs its hooks inside the caller's own render —
 * they join that component's hook list, and the first render where the caller's
 * count differs throws "rendered more hooks than during the previous render"
 * from somewhere inside the pager, with a stack that never mentions this file.
 * Wrapping it in an element gives the bar a hook list of its own.
 *
 * At module scope so the type is stable and the navigator does not remount the
 * bar on every render.
 */
const renderThemeTabBar = (props: ThemeTabBarProps): ReactElement => <ThemeTabBar {...props} />;

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

			<TopTabs tabBar={renderThemeTabBar}>
				<TopTabs.Screen name="index" options={{ title: "Design" }} />
				<TopTabs.Screen name="preview" options={{ title: "Preview" }} />
			</TopTabs>
		</Screen>
	);
}
