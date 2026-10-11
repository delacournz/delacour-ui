/** One person or team on the board. `value` is the score the board ranks by. */
export type LeaderboardEntry = {
	/** Stable identity — what `highlightId` and React's `key` match on. */
	id: string;
	name: string;
	/** The score. Formatted by `formatValue`, ranked by `order`. */
	value: number;
	/** Places moved since the last period: positive climbed, negative fell, `0` held. */
	change?: number;
	/** A second line under the name — a team, a city, a streak. */
	subtitle?: string;
};

/** An entry with the place it earned. */
export type RankedEntry = {
	entry: LeaderboardEntry;
	/** Standard competition rank — `1, 2, 2, 4`. */
	rank: number;
	/** Shares its value, and so its rank, with at least one other entry. */
	isTied: boolean;
};
