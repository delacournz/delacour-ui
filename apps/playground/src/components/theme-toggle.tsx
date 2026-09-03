import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconMoon, IconSun } from "delacour-react-native-ui/icons/central";
import { type ReactElement, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useUniwind } from "uniwind";
import { setThemeMode } from "@/design-system/store";

const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;

/**
 * Flips the whole app between light and dark, from wherever you are.
 *
 * A navbar action rather than a row of buttons, and now the app's only control
 * over the theme: `/theme` carried a three-state Appearance row until this
 * became its navbar action too, and the two could not coexist — a two-state
 * toggle above a three-state control over one setting is two controls
 * disagreeing about how many states there are.
 *
 * **`system` therefore has no control anywhere.** The store still persists it
 * and a fresh install still starts on it, so the mode is reachable by clearing
 * app data and not otherwise. That is a real loss and a deliberate one: the
 * thing this is reached for is flipping a component between palettes while
 * looking at it, which wants one tap and no third state to read past.
 *
 * **The glyph is the destination, not the state.** A sun means "go light", so it
 * shows while the app is dark. A control whose icon named the current theme
 * would be a label wearing a button's clothes.
 *
 * It writes through `setThemeMode` rather than calling `Uniwind.setTheme`
 * itself, so a flip made here is stored and survives a restart exactly as one
 * made in the customizer does. Two controls over one setting that disagreed
 * about whether it was remembered would be worse than either alone. The theme
 * underneath is still global, so there is no state to lift and nothing to
 * thread through a provider — every screen mounting this reads and writes the
 * same theme, and `useUniwind` re-renders each of them.
 *
 * The glyphs crossfade rather than swapping, and the exchange happens at the
 * trough — the same shape as `DemoPageLabel`, for the same reason: rendering
 * the new glyph immediately would fade out the icon that has already changed.
 * `scheduleOnRN` is how the UI-thread callback reaches React.
 *
 * **Deliberately no spin.** A half turn per tap is the obvious motion for this
 * control and it is wrong here: it rests the crescent upside-down, and a full
 * turn to avoid that competes with the thing actually being animated, which is
 * every colour on the screen changing at once.
 */
export function ThemeToggle(): ReactElement {
	const { theme } = useUniwind();
	const [displayed, setDisplayed] = useState(theme);
	const opacity = useSharedValue(1);

	useEffect(() => {
		if (displayed === theme) return;
		opacity.value = withSequence(
			withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
				if (finished) scheduleOnRN(setDisplayed, theme);
			}),
			withTiming(1, { duration: FADE_IN_MS })
		);
	}, [displayed, theme, opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	const isDark = theme === "dark";

	return (
		<Button
			accessibilityHint="Switches the whole app between light and dark"
			accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
			haptic="selection"
			onPress={() => setThemeMode(isDark ? "light" : "dark")}
			size="icon-sm"
			testID="theme-toggle"
			variant="ghost"
		>
			<Animated.View style={style}>
				<Icon icon={displayed === "dark" ? IconSun : IconMoon} />
			</Animated.View>
		</Button>
	);
}
