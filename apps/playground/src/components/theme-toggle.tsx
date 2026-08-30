import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMoon, IconSun } from "@delacour/native-ui/icons/central";
import { type ReactElement, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Uniwind, useUniwind } from "uniwind";

const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;
const HALF_TURN_DEG = 180;

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
 * **The glyph is the destination, not the state.** A sun means "go light", so
 * it shows while the app is dark. A control whose icon named the current theme
 * would be a label wearing a button's clothes.
 *
 * `Uniwind.setTheme` is global, so there is no state to lift and nothing to
 * thread through a provider — every screen mounting this reads and writes the
 * same theme, and `useUniwind` re-renders each of them when it changes.
 *
 * The swap is a half turn with a fade through the trough, and the glyph is
 * exchanged at the bottom of it — the same shape as `DemoPageLabel`'s crossfade
 * and for the same reason: rendering the new glyph immediately would spin the
 * icon you are already looking at. `scheduleOnRN` is how the UI-thread callback
 * reaches React. The rotation accumulates rather than resetting, so a second
 * tap keeps turning the same way instead of unwinding the first.
 */
export function ThemeToggle(): ReactElement {
	const { theme } = useUniwind();
	const [displayed, setDisplayed] = useState(theme);
	const opacity = useSharedValue(1);
	const rotation = useSharedValue(0);

	useEffect(() => {
		if (displayed === theme) return;
		opacity.value = withSequence(
			withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
				if (finished) scheduleOnRN(setDisplayed, theme);
			}),
			withTiming(1, { duration: FADE_IN_MS })
		);
		rotation.value = withTiming(rotation.value + HALF_TURN_DEG, { duration: FADE_OUT_MS + FADE_IN_MS });
	}, [displayed, theme, opacity, rotation]);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

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
