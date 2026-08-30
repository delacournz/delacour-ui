import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMoon, IconSun } from "@delacour/native-ui/icons/central";
import { type ReactElement, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Uniwind, useUniwind } from "uniwind";

const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;

/**
 * Flips the whole app between light and dark, from wherever you are.
 *
 * A navbar action rather than a row of buttons: the index screen already offers
 * the full three-way choice — light, dark, **system** — and that is the place to
 * make a decision. This is the one you reach for while looking at a component,
 * so it is a single tap with no target to aim at and no third state to read.
 * Choosing either theme here leaves adaptive mode behind, exactly as the index's
 * own light and dark buttons do; the index is where you hand the app back to the
 * system.
 *
 * **The glyph is the destination, not the state.** A sun means "go light", so it
 * shows while the app is dark. A control whose icon named the current theme
 * would be a label wearing a button's clothes.
 *
 * `Uniwind.setTheme` is global, so there is no state to lift and nothing to
 * thread through a provider — every screen mounting this reads and writes the
 * same theme, and `useUniwind` re-renders each of them when it changes.
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
			isIconOnly
			onPress={() => Uniwind.setTheme(isDark ? "light" : "dark")}
			size="sm"
			testID="theme-toggle"
			variant="ghost"
		>
			<Animated.View style={style}>
				<Icon icon={displayed === "dark" ? IconSun : IconMoon} />
			</Animated.View>
		</Button>
	);
}
