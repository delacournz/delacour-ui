import { useThemeColor } from "delacour-react-native-ui/hooks/use-theme-color";
import { Screen } from "delacour-react-native-ui/screen";
import { Tabs } from "delacour-react-native-ui/tabs";
import { createContext, type ReactElement, type ReactNode, useContext, useMemo, useState } from "react";
import { Animated, type LayoutChangeEvent, View } from "react-native";

/** What the navigator hands a `tabBar`, restated — see the note in `ThemeTabBar`. */
export type ThemeTabBarProps = {
	state: { index: number; routes: readonly { key: string; name: string }[] };
	descriptors: Record<string, { options: { title?: string } } | undefined>;
	navigation: {
		emit: (event: { canPreventDefault: true; target: string; type: "tabPress" }) => { defaultPrevented: boolean };
		navigate: (name: string) => void;
	};
	/**
	 * The pager's live offset, in page units, as a React Native `Animated` node.
	 *
	 * Read as an animation *input* and never as a value. It is an
	 * `AnimatedAddition` driven by the native driver, and `addListener` on a
	 * derived native node never fires on Fabric — so nothing here can learn its
	 * number, but a style interpolated from it still moves natively, every frame,
	 * without JS.
	 */
	position: Animated.AnimatedInterpolation<number>;
};

/**
 * The `gap-6` every tab's scroll content carries between its children.
 *
 * The spacer is one of those children, so the container puts this much between
 * it and the first real row — and the spacer has to give it back, or the bar's
 * own bottom padding is paid twice and the content floats well clear of the
 * pill instead of sitting under it.
 */
const CONTENT_GAP = 24;

type TabFrame = { x: number; width: number };
type ThemeTabBarInset = { inset: number; setInset: (height: number) => void };

const ThemeTabBarInsetContext = createContext<ThemeTabBarInset | null>(null);

/**
 * Carries the floating bar's measured height from the bar to the tabs.
 *
 * The bar and the screens are siblings inside the navigator — the bar cannot
 * wrap them — so the height has to travel up to a provider above the navigator
 * and back down. Measured rather than declared, because the bar's height is the
 * sum of a token-driven control and its own padding, and every one of those
 * moves with the Style axis.
 */
export function ThemeTabBarProvider({ children }: { children: ReactNode }): ReactElement {
	const [inset, setInset] = useState(0);
	const value = useMemo<ThemeTabBarInset>(() => ({ inset, setInset }), [inset]);

	return <ThemeTabBarInsetContext value={value}>{children}</ThemeTabBarInsetContext>;
}
ThemeTabBarProvider.displayName = "Playground.ThemeTabBarProvider";

/** The bar's measured height, for anything that has to clear it. */
/**
 * The room a tab's content leaves for the bar floating over it.
 *
 * A spacer at the head of the scroll content rather than padding on the
 * container: `Screen.ScrollArea` already reserves the navbar the same way, and
 * its content container's padding is a class, so a `contentContainerStyle`
 * passed alongside would be a second writer on the one property.
 *
 * It is the bar's height less {@link CONTENT_GAP}, so the first row lands at
 * the bar's own bottom edge rather than a further gap below it.
 */
export function useThemeTabBarInset(): number {
	return useContext(ThemeTabBarInsetContext)?.inset ?? 0;
}

export function ThemeTabBarSpacer(): ReactElement {
	const context = useContext(ThemeTabBarInsetContext);
	return <View style={{ height: CONTENT_GAP }} />;
}
ThemeTabBarSpacer.displayName = "Playground.ThemeTabBarSpacer";

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
 * **The stride is measured, not assumed to be the tab's width.** `Tabs.List`
 * puts a gap between triggers, so a tab's width is short of the distance from
 * one to the next by exactly that gap — multiplying by the width alone left the
 * capsule a gap's-worth clear of the right edge on the last tab, and nowhere
 * else, which is why it only showed against the track's rounded end.
 *
 * The width is static rather than interpolated because it cannot be otherwise:
 * `position` is driven by the native driver, which animates transforms and
 * opacity and nothing else. Tabs of unequal width would need the value on the
 * JS thread, and it is not available there at all.
 */
function TabIndicator({
	position,
	offset,
	stride,
	width,
}: {
	position: Animated.AnimatedInterpolation<number>;
	offset: number;
	stride: number;
	width: number;
}): ReactElement | null {
	const elevated = useThemeColor("elevated");

	if (width === 0) return null;

	return (
		<Animated.View
			pointerEvents="none"
			style={{
				backgroundColor: elevated,
				borderRadius: 9999,
				bottom: 0,
				left: offset,
				position: "absolute",
				top: 0,
				transform: [{ translateX: Animated.multiply(position, stride) }],
				width,
			}}
		/>
	);
}
TabIndicator.displayName = "Playground.ThemeTabBar.Indicator";

/**
 * The bar, drawn with the library's own `Tabs` and floated over the pager.
 *
 * **It draws the scroll fade behind itself.** Paint order is source order, and
 * nothing outside the navigator can slot between the pages it renders and this
 * bar it renders over them — a fade mounted as a sibling of the navigator lands
 * on top of the bar rather than under it. So the fade lives here, as the first
 * child, anchored to this container instead of to the screen.
 *
 * **Absolutely positioned, so the tabs scroll under it.** Left in the flow it
 * would take a band off the top of every page and the pill would read as a
 * second toolbar bolted under the first. Over the content it reads as what it
 * is — a control belonging to the screen rather than to the chrome — and the
 * only opaque part is the track itself, so the page passes visibly behind it.
 * What that costs is the room it occupies, which is why it measures itself and
 * `ThemeTabBarSpacer` gives it back at the head of each tab.
 *
 * `tabBar` replaces the material bar wholesale, so what is on screen is the
 * component this app exists to show off, while the navigator keeps the parts it
 * is better at: the pager, the routes, and the URL. `isSwipeable={false}`
 * because the pager already owns the horizontal gesture.
 *
 * `tabPress` is emitted before navigating because that is the navigator's
 * contract — a screen can cancel it — and it is what keeps a re-press of the
 * focused tab from re-entering it.
 */
function ThemeTabBar({ state, descriptors, navigation, position }: ThemeTabBarProps): ReactElement {
	const context = useContext(ThemeTabBarInsetContext);
	const inset = context?.inset ?? 0;
	const current = state.routes[state.index]?.name ?? null;
	const [frames, setFrames] = useState<readonly TabFrame[]>([]);

	const measureTab = (index: number) => (event: LayoutChangeEvent) => {
		const { x, width } = event.nativeEvent.layout;
		setFrames((previous) => {
			if (previous[index]?.x === x && previous[index]?.width === width) return previous;
			const next = [...previous];
			next[index] = { width, x };
			return next;
		});
	};
	const measureBar = (event: LayoutChangeEvent) => context?.setInset(event.nativeEvent.layout.height);

	const first = frames[0];
	// The distance from one tab to the next, gap included. Two tabs is all this
	// bar has; a third would want an interpolation across every frame instead.
	const stride = frames.length > 1 && first ? (frames[1]?.x ?? 0) - first.x : 0;

	const select = (name: string) => {
		const route = state.routes.find((candidate) => candidate.name === name);
		if (!route || route.name === current) return;

		const event = navigation.emit({ canPreventDefault: true, target: route.key, type: "tabPress" });
		if (event.defaultPrevented) return;

		navigation.navigate(route.name);
	};

	return (
		<View className="absolute inset-x-0 top-0 z-10" pointerEvents="box-none">
			<Screen.ScrollShadow anchor="parent" coverTop={inset} edges="top" />
			<View className="px-screen-gutter pt-2 pb-2" onLayout={measureBar}>
				<Tabs isSwipeable={false} onValueChange={select} value={current}>
					<Tabs.List>
						<TabIndicator offset={first?.x ?? 0} position={position} stride={stride} width={first?.width ?? 0} />
						{state.routes.map((route, index) => (
							<Tabs.Trigger
								key={route.key}
								onLayout={measureTab(index)}
								testID={`theme-tab-${route.name}`}
								value={route.name}
							>
								<Tabs.Label>{descriptors[route.key]?.options.title ?? route.name}</Tabs.Label>
							</Tabs.Trigger>
						))}
					</Tabs.List>
				</Tabs>
			</View>
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
export const renderThemeTabBar = (props: ThemeTabBarProps): ReactElement => <ThemeTabBar {...props} />;
