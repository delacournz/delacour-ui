import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { type LeaderboardContextValue, LeaderboardProvider } from "./leaderboard.context";
import type { LeaderboardEntry } from "./leaderboard.types";
import {
	applyLeaderboardLimit,
	defaultFormatValue,
	hasMovementColumn,
	LEADERBOARD_DEFAULT_PODIUM_HEIGHT,
	type LeaderboardOrder,
	type LeaderboardPodiumScale,
	type LeaderboardPodium as LeaderboardPodiumStyle,
	leaderboardVariants,
	rankLeaderboard,
	resolveLeaderboardPodium,
	splitPodium,
} from "./leaderboard.variants";
import { LeaderboardEmpty } from "./leaderboard-empty";
import { LeaderboardPodium } from "./leaderboard-podium";
import { LeaderboardRow } from "./leaderboard-row";

export type LeaderboardProps = Omit<ViewProps, "children"> & {
	/** Everyone on the board, in any order — the board ranks them. */
	data: readonly LeaderboardEntry[];
	/** How the top three stand. Needs three entries on show; with fewer the board is all rows. Default `bars`. */
	podium?: LeaderboardPodiumStyle;
	/** `desc` when more is better, `asc` when less is — a lap time. Default `desc`. */
	order?: LeaderboardOrder;
	/** What a bar's height says: the score, or only the place. Forced to `rank` when `order` is `asc`. Default `value`. */
	podiumScale?: LeaderboardPodiumScale;
	/** The tallest bar, in points. Default 132. */
	podiumHeight?: number;
	/** How many places to show, the podium included. The board is not virtualised — keep it short. */
	limit?: number;
	/** The entry that is "you": tinted, and pinned below the cut with its true rank if `limit` drops it. */
	highlightId?: string;
	/** Turns a score into text. Default: the locale's grouping, up to two decimals. */
	formatValue?: (value: number) => string;
	/** What the number counts — "points", "seconds". Spoken after every value; without it a score is a bare number. */
	unit?: string;
	/** An avatar or a flag beside each name. */
	renderMedia?: (entry: LeaderboardEntry, rank: number) => ReactNode;
	/** Makes every place a button. */
	onPressEntry?: (entry: LeaderboardEntry, rank: number) => void;
	/** Shown when `data` is empty. Default "No entries yet". */
	emptyText?: string;
	className?: string;
};

function LeaderboardRoot({
	data,
	podium = "bars",
	order = "desc",
	podiumScale = "value",
	podiumHeight = LEADERBOARD_DEFAULT_PODIUM_HEIGHT,
	limit,
	highlightId,
	formatValue = defaultFormatValue,
	unit,
	renderMedia,
	onPressEntry,
	emptyText = "No entries yet",
	className,
	testID,
	...props
}: LeaderboardProps): ReactElement {
	const ranked = useMemo(() => rankLeaderboard(data, order), [data, order]);
	const { rows: shown, pinned } = applyLeaderboardLimit(ranked, limit, highlightId);
	const podiumStyle = resolveLeaderboardPodium(podium, shown.length);
	const split = splitPodium(shown, podiumStyle);
	const slots = leaderboardVariants();

	const context = useMemo<LeaderboardContextValue>(
		() => ({
			formatValue,
			highlightId,
			onPressEntry,
			renderMedia,
			showMovement: hasMovementColumn(data),
			unit,
		}),
		[data, formatValue, highlightId, onPressEntry, renderMedia, unit]
	);

	const rowTestID = (id: string): string | undefined => (testID ? `${testID}-row-${id}` : undefined);

	// The "…" between the cut and the pinned entry is decoration: the pinned
	// row's own label already says its rank, so the gap is hidden from
	// assistive technology rather than read as an unlabelled stop.
	return (
		<LeaderboardProvider value={context}>
			<View className={slots.root({ className })} testID={testID} {...props}>
				{data.length === 0 ? <LeaderboardEmpty text={emptyText} /> : null}
				{podiumStyle === "none" ? null : (
					<LeaderboardPodium
						height={podiumHeight}
						order={order}
						podium={split.podium}
						scale={podiumScale}
						testID={testID ? `${testID}-podium` : undefined}
						variant={podiumStyle}
					/>
				)}
				{split.rows.length > 0 || pinned ? (
					<View className={slots.rows()}>
						{split.rows.map((ranked) => (
							<LeaderboardRow key={ranked.entry.id} ranked={ranked} testID={rowTestID(ranked.entry.id)} />
						))}
						{pinned ? (
							<>
								<View
									accessibilityElementsHidden
									className={slots.separator()}
									importantForAccessibility="no-hide-descendants"
								>
									<Text className={slots.separatorText()}>…</Text>
								</View>
								<LeaderboardRow ranked={pinned} testID={testID ? `${testID}-pinned` : undefined} />
							</>
						) : null}
					</View>
				) : null}
			</View>
		</LeaderboardProvider>
	);
}

/**
 * Ranked people or teams, with the top three on a podium — a fitness
 * challenge, a sales board, a game's scores.
 *
 * Pass the entries in any order and the board ranks them: a stable sort by
 * value, then standard competition ranking, so a tie for second is `1, 2, 2,
 * 4` and the tied entries keep the order you gave them. `order="asc"` ranks
 * the smallest first, for times.
 *
 * The first three positions stand on a podium — bars that grow on mount, or
 * three lifted cards — in the theme's primary at three strengths. The rest are
 * rows: rank, media, name, movement and value. `highlightId` tints "you", and
 * if `limit` cuts you off you are pinned under the cut with your true rank.
 *
 * Not virtualised. Pass `limit` for a long board. Pass `unit` too — it is
 * what a screen reader says after every number.
 *
 * @example
 * <Leaderboard data={entries} highlightId={me} limit={10} onPressEntry={open} unit="points" />
 *
 * @example
 * <Leaderboard data={laps} formatValue={formatLapTime} order="asc" podium="cards" unit="seconds" />
 *
 * @example
 * <Leaderboard
 *   data={entries}
 *   renderMedia={(entry) => <Avatar name={entry.name} size="sm" />}
 *   unit="steps"
 * />
 */
export const Leaderboard = Object.assign(LeaderboardRoot, {
	displayName: "DelacourUI.Leaderboard",
});
