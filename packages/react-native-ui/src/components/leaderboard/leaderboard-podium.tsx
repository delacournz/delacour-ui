import type { ReactElement } from "react";
import { View } from "react-native";
import type { RankedEntry } from "./leaderboard.types";
import {
	type LeaderboardOrder,
	type LeaderboardPodiumScale,
	leaderboardVariants,
	resolvePodiumDelays,
	resolvePodiumHeights,
	resolvePodiumOrder,
} from "./leaderboard.variants";
import { LeaderboardPodiumPlace } from "./leaderboard-podium-place";

export type LeaderboardPodiumProps = {
	/** The first three positions, in rank order. */
	podium: readonly RankedEntry[];
	variant: "bars" | "cards";
	scale: LeaderboardPodiumScale;
	order: LeaderboardOrder;
	/** The tallest bar, in points. */
	height: number;
	testID?: string;
};

/**
 * The top three, in visual order second–first–third so the leader stands in
 * the middle.
 *
 * Heights and delays are resolved in rank order and then reordered with the
 * places, so the leader keeps the tallest bar and the last start wherever it
 * is drawn. Screen readers walk the places left to right, which reads second
 * before first; each label opens with its rank, so the order is never in doubt.
 */
export function LeaderboardPodium({
	podium,
	variant,
	scale,
	order,
	height,
	testID,
}: LeaderboardPodiumProps): ReactElement {
	const heights = resolvePodiumHeights(podium, scale, order, height);
	const delays = resolvePodiumDelays();
	const places = resolvePodiumOrder(
		podium.map((ranked, i) => ({ ranked, height: heights[i] ?? height, delay: delays[i] ?? 0, position: i + 1 }))
	);

	return (
		<View className={leaderboardVariants().podium()} testID={testID}>
			{places.map(({ ranked, height: barHeight, delay, position }) =>
				variant === "bars" ? (
					<LeaderboardPodiumPlace
						delay={delay}
						height={barHeight}
						key={ranked.entry.id}
						ranked={ranked}
						testID={testID ? `${testID}-place-${position}` : undefined}
						variant="bars"
					/>
				) : (
					<LeaderboardPodiumPlace
						key={ranked.entry.id}
						ranked={ranked}
						testID={testID ? `${testID}-place-${position}` : undefined}
						variant="cards"
					/>
				)
			)}
		</View>
	);
}
LeaderboardPodium.displayName = "DelacourUI.Leaderboard.Podium";
