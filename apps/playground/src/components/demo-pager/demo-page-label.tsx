import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;

/**
 * The current demo's name, crossfaded rather than swapped.
 *
 * A hard swap on a label this small reads as a glitch — the eye catches the
 * change without being able to say what changed. Fading out first and only then
 * replacing the text is what makes the two titles read as a sequence.
 *
 * Which is why the displayed title is state of its own rather than the prop:
 * rendering the prop directly would fade the *new* title out and the same new
 * title back in. The swap happens at the trough, in the first leg's completion
 * callback, and `scheduleOnRN` is how a UI-thread callback reaches React.
 *
 * One `withSequence` rather than two effects: the fade back in belongs to the
 * same animation as the fade out, and an effect keyed on the swapped state
 * would list a dependency it never reads.
 *
 * Shrink-wrapped rather than `flex-1`: the chevron beside it belongs to the
 * name, and a label that claims the whole row strands the chevron at the far
 * edge where it reads as a second, unrelated control.
 */
export function DemoPageLabel({ title }: { title: string }): ReactElement {
	const [displayed, setDisplayed] = useState(title);
	const opacity = useSharedValue(1);

	useEffect(() => {
		if (displayed === title) return;
		opacity.value = withSequence(
			withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
				if (finished) scheduleOnRN(setDisplayed, title);
			}),
			withTiming(1, { duration: FADE_IN_MS })
		);
	}, [displayed, title, opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<Animated.View className="min-w-0 shrink" style={style}>
			<Text.Overline color="default" numberOfLines={1} size="sm">
				{displayed}
			</Text.Overline>
		</Animated.View>
	);
}
