import { type ReactElement, type ReactNode, useEffect } from "react";
import { View } from "react-native";
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { Pressable } from "../pressable";
import { Surface } from "../surface";
import { Text } from "../text";
import { useLeaderboardPart } from "./leaderboard.context";
import type { RankedEntry } from "./leaderboard.types";
import {
	LEADERBOARD_BAR_DURATION_MS,
	leaderboardVariants,
	resolveLeaderboardAccessibilityLabel,
	resolvePodiumPlace,
} from "./leaderboard.variants";

export type LeaderboardPodiumPlaceProps =
	| {
			variant: "bars";
			ranked: RankedEntry;
			/** The bar's resting height, in points. */
			height: number;
			/** How long after mount this bar starts growing. */
			delay: number;
			testID?: string;
	  }
	| {
			variant: "cards";
			ranked: RankedEntry;
			testID?: string;
	  };

/**
 * A bar that grows from nothing to `height` once the board mounts, `delay`
 * after it — the podium staggers third, second, first so the reveal ends on
 * the winner. With reduce motion on it is drawn at full height immediately.
 *
 * Its height is animated rather than its scale: a scaled bar would squash the
 * rank number inside it, and the board is three views, not a list, so the
 * layout pass a height costs is three views' worth.
 */
function LeaderboardPodiumBar({
	height,
	delay,
	place,
	rank,
}: {
	height: number;
	delay: number;
	place: 1 | 2 | 3;
	rank: number;
}): ReactElement {
	const isReducedMotion = useReducedMotion();
	const grown = useSharedValue(isReducedMotion ? height : 0);

	useEffect(() => {
		if (isReducedMotion) {
			grown.value = height;
			return;
		}
		grown.value = withDelay(
			delay,
			withTiming(height, {
				duration: LEADERBOARD_BAR_DURATION_MS,
				easing: Easing.out(Easing.cubic),
				reduceMotion: ReduceMotion.System,
			})
		);
	}, [delay, grown, height, isReducedMotion]);

	const style = useAnimatedStyle(() => ({ height: grown.value }));
	const slots = leaderboardVariants({ place });

	return (
		<Animated.View className={slots.podiumBar()} style={style}>
			<Text className={slots.podiumBarRank()}>{rank}</Text>
		</Animated.View>
	);
}
LeaderboardPodiumBar.displayName = "DelacourUI.Leaderboard.PodiumPlace.Bar";

/**
 * One of the three podium places — a growing bar, or a lifted card.
 *
 * Its media, name and value stand above the bar in `bars`, and inside the card
 * in `cards`, where a numbered disc in the place's tone carries the rank. The
 * tone follows the rank rather than the position, so two tied leaders share
 * the first tone and the first height.
 *
 * Like a row, the whole place is one accessibility element with one sentence
 * for a label, and a button only when the board has `onPressEntry`.
 */
export function LeaderboardPodiumPlace(props: LeaderboardPodiumPlaceProps): ReactElement {
	const { formatValue, unit, highlightId, renderMedia, onPressEntry } = useLeaderboardPart("Leaderboard.PodiumPlace");
	const { ranked, testID } = props;
	const { entry, rank } = ranked;
	const place = resolvePodiumPlace(rank);
	const isHighlighted = entry.id === highlightId;
	const slots = leaderboardVariants({ isHighlighted, place });
	const formattedValue = formatValue(entry.value);
	const accessibilityLabel = resolveLeaderboardAccessibilityLabel({ formattedValue, ranked, unit });
	const media = renderMedia?.(entry, rank);
	const Name = isHighlighted ? Text.Strong : Text;

	const details: ReactNode = (
		<>
			{media === undefined || media === null ? null : <View className={slots.podiumMedia()}>{media}</View>}
			<Name className={slots.podiumName()} numberOfLines={1}>
				{entry.name}
			</Name>
			<Text.Caption className={slots.podiumValue()} numberOfLines={1}>
				{formattedValue}
			</Text.Caption>
		</>
	);

	// A card's rank disc sits above its details; a bar carries its rank inside
	// it, under the details.
	const body =
		props.variant === "cards" ? (
			<Surface className={slots.podiumCard()} padding="sm">
				<View className={slots.podiumCardRank()}>
					<Text className={slots.podiumCardRankText()}>{rank}</Text>
				</View>
				{details}
			</Surface>
		) : (
			<>
				{details}
				<LeaderboardPodiumBar delay={props.delay} height={props.height} place={place} rank={rank} />
			</>
		);

	if (onPressEntry) {
		return (
			<Pressable
				accessibilityLabel={accessibilityLabel}
				className={slots.podiumPlace()}
				feedback="scale"
				haptic="selection"
				onPress={() => onPressEntry(entry, rank)}
				testID={testID}
			>
				{body}
			</Pressable>
		);
	}

	return (
		<View accessibilityLabel={accessibilityLabel} accessible className={slots.podiumPlace()} testID={testID}>
			{body}
		</View>
	);
}
LeaderboardPodiumPlace.displayName = "DelacourUI.Leaderboard.PodiumPlace";
