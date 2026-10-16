import { type ReactElement, useState } from "react";
import { View } from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	LayoutAnimationConfig,
	ReduceMotion,
	SlideInDown,
	SlideInUp,
} from "react-native-reanimated";
import { Text } from "../text";
import { type PostStatDirection, resolveStatDirection } from "./post.variants";

/** How long a count takes to roll in, in milliseconds. Short: a count is feedback, not a show. */
const POST_COUNT_ROLL_MS = 220;
/** How long the outgoing count takes to fade. Faster than the roll, so the two never read as two numbers. */
const POST_COUNT_FADE_MS = 120;

export type PostStatCountProps = {
	/** The raw value — a direction is only computed between two numbers. */
	value: number | string;
	/** What is printed: `1.2K` for `1234`. */
	text: string;
	/** Classes for the number's `Text` — size, weight and colour. */
	className?: string;
	/** Classes for the clipping box the roll happens inside. */
	containerClassName?: string;
};

/** The entering animation a count arrives with, by which way it moved. */
function enteringFor(direction: PostStatDirection) {
	if (direction === "up") return SlideInDown.duration(POST_COUNT_ROLL_MS).reduceMotion(ReduceMotion.System);
	if (direction === "down") return SlideInUp.duration(POST_COUNT_ROLL_MS).reduceMotion(ReduceMotion.System);
	return FadeIn.duration(POST_COUNT_ROLL_MS).reduceMotion(ReduceMotion.System);
}

const exiting = FadeOut.duration(POST_COUNT_FADE_MS).reduceMotion(ReduceMotion.System);

/**
 * A number that rolls when it changes — up from below when it rose, down from
 * above when it fell, a cross-fade when there is no direction to show.
 *
 * The number is keyed on its text, so a change mounts a new `Animated.View`
 * with an `entering` animation and unmounts the old one with an `exiting`
 * fade. Only the arriving half carries direction: the leaving half was
 * rendered before the change was known.
 *
 * The direction is derived state, recorded during render against the previous
 * value held in state — not a ref read in render, which React Compiler is free
 * to treat as stable.
 *
 * `LayoutAnimationConfig skipEntering` keeps the first value still: a feed
 * mounting forty cards should not roll forty numbers into place.
 *
 * Reduced motion swaps the value instantly — `ReduceMotion.System` on both
 * halves. The roll is behaviour, not an endless loop, so `useCalmMotion` is not
 * consulted.
 */
export function PostStatCount({ value, text, className, containerClassName }: PostStatCountProps): ReactElement {
	const [previous, setPrevious] = useState(value);
	const [direction, setDirection] = useState<PostStatDirection>("none");
	if (previous !== value) {
		setPrevious(value);
		setDirection(resolveStatDirection(previous, value));
	}

	return (
		<View className={containerClassName}>
			<LayoutAnimationConfig skipEntering>
				<Animated.View entering={enteringFor(direction)} exiting={exiting} key={text}>
					<Text className={className}>{text}</Text>
				</Animated.View>
			</LayoutAnimationConfig>
		</View>
	);
}
PostStatCount.displayName = "DelacourUI.Post.Stat.Count";
