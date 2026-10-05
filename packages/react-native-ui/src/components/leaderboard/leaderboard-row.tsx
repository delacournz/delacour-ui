import type { ReactElement } from "react";
import { View } from "react-native";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useLeaderboardPart } from "./leaderboard.context";
import type { RankedEntry } from "./leaderboard.types";
import { leaderboardVariants, resolveLeaderboardAccessibilityLabel } from "./leaderboard.variants";
import { LeaderboardMovement } from "./leaderboard-movement";

export type LeaderboardRowProps = {
	ranked: RankedEntry;
	testID?: string;
};

/**
 * One place below the podium: rank, media, name and subtitle, movement, value.
 *
 * The whole row is one accessibility element with one sentence for a label, so
 * VoiceOver reads a place in a single stop rather than five. With
 * `onPressEntry` it is a `Pressable` and announced as a button; without, it is
 * a plain view, so a board nobody can tap does not pretend to be a list of
 * buttons.
 *
 * The highlighted row is `primary` at 10% with the name in `Text.Strong` —
 * found at a glance, without a second accent competing with the podium.
 */
export function LeaderboardRow({ ranked, testID }: LeaderboardRowProps): ReactElement {
	const { formatValue, unit, highlightId, showMovement, renderMedia, onPressEntry } =
		useLeaderboardPart("Leaderboard.Row");
	const { entry, rank } = ranked;
	const isHighlighted = entry.id === highlightId;
	const slots = leaderboardVariants({ isHighlighted });
	const formattedValue = formatValue(entry.value);
	const accessibilityLabel = resolveLeaderboardAccessibilityLabel({ formattedValue, ranked, unit });
	const media = renderMedia?.(entry, rank);
	const Name = isHighlighted ? Text.Strong : Text;

	const content = (
		<>
			<Text className={slots.rowRank()}>{rank}</Text>
			{media === undefined || media === null ? null : <View className={slots.rowMedia()}>{media}</View>}
			<View className={slots.rowBody()}>
				<Name className={slots.rowName()} numberOfLines={1}>
					{entry.name}
				</Name>
				{entry.subtitle ? (
					<Text.Caption className={slots.rowSubtitle()} numberOfLines={1}>
						{entry.subtitle}
					</Text.Caption>
				) : null}
			</View>
			{showMovement ? <LeaderboardMovement change={entry.change} /> : null}
			<Text className={slots.rowValue()}>{formattedValue}</Text>
		</>
	);

	if (onPressEntry) {
		return (
			<Pressable
				accessibilityLabel={accessibilityLabel}
				className={slots.row()}
				feedback="fade"
				haptic="selection"
				onPress={() => onPressEntry(entry, rank)}
				testID={testID}
			>
				{content}
			</Pressable>
		);
	}

	return (
		<View accessibilityLabel={accessibilityLabel} accessible className={slots.row()} testID={testID}>
			{content}
		</View>
	);
}
LeaderboardRow.displayName = "DelacourUI.Leaderboard.Row";
