import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { LeaderboardEntry, RankedEntry } from "./leaderboard.types";

/** `bars` grows a column per place; `cards` lifts three surfaces; `none` lists everyone in rows. */
export const LEADERBOARD_PODIUMS = ["bars", "cards", "none"] as const;

/** `desc` when more is better — points, sales. `asc` when less is — a lap time, a golf score. */
export const LEADERBOARD_ORDERS = ["desc", "asc"] as const;

/** What a podium bar's height says: the score itself, or only the place. */
export const LEADERBOARD_PODIUM_SCALES = ["value", "rank"] as const;

export type LeaderboardPodium = (typeof LEADERBOARD_PODIUMS)[number];
export type LeaderboardOrder = (typeof LEADERBOARD_ORDERS)[number];
export type LeaderboardPodiumScale = (typeof LEADERBOARD_PODIUM_SCALES)[number];

/** A podium tone: first, second or third. */
export type LeaderboardPlace = 1 | 2 | 3;

/** The tallest podium bar, in points, when the caller names none. */
export const LEADERBOARD_DEFAULT_PODIUM_HEIGHT = 132;

/** How long one bar takes to grow. */
export const LEADERBOARD_BAR_DURATION_MS = 500;

/** The gap between one bar starting and the next. */
export const LEADERBOARD_BAR_STAGGER_MS = 80;

/** On the value scale, no bar drops below this share of the tallest — a tiny third stays visible. */
export const LEADERBOARD_MIN_BAR_RATIO = 0.35;

/** On the rank scale, first / second / third as a share of the tallest. */
export const LEADERBOARD_RANK_BAR_RATIOS = [1, 0.75, 0.55] as const;

/** The fewest entries a podium needs; below it the board is all rows. */
export const LEADERBOARD_PODIUM_SIZE = 3;

/**
 * Styling for every part of a leaderboard.
 *
 * The podium's three tones are the theme's `primary` at 100, 70 and 45
 * percent, keyed on `place` — never gold, silver and bronze. The number on the
 * podium already says the place, and three metals would be the one palette on
 * the screen no theme can retune.
 *
 * The rank column has a fixed width and both numbers are `tabular-nums`, so
 * names line up down the board and values line up down their edge whatever
 * the digits are.
 *
 * View slots carry no `text-*` (rule 1). Free of React Native imports so it
 * stays unit-testable.
 */
export const leaderboardVariants = tv({
	slots: {
		root: "gap-4",
		podium: "flex-row items-end gap-2",
		podiumPlace: "min-w-0 flex-1 items-center gap-1",
		podiumMedia: "mb-1 items-center justify-center",
		podiumName: "text-center",
		podiumValue: "text-center text-muted-foreground tabular-nums",
		podiumBar: "mt-1 w-full items-center overflow-hidden rounded-t-md pt-2",
		podiumBarRank: "font-semibold text-lg text-primary-foreground tabular-nums",
		podiumCard: "w-full items-center gap-1",
		podiumCardRank: "mb-1 size-7 items-center justify-center rounded-full",
		podiumCardRankText: "font-semibold text-primary-foreground text-sm tabular-nums",
		rows: "gap-1",
		row: "min-h-12 flex-row items-center gap-3 rounded-md px-2 py-2",
		rowRank: "w-8 text-center font-medium text-muted-foreground tabular-nums",
		rowMedia: "shrink-0",
		rowBody: "min-w-0 flex-1",
		rowName: "",
		rowSubtitle: "",
		movement: "w-10 flex-row items-center justify-end gap-0.5",
		movementText: "font-medium text-xs tabular-nums",
		rowValue: "text-right font-medium text-foreground tabular-nums",
		separator: "items-center py-1",
		separatorText: "text-muted-foreground",
		empty: "items-center py-6",
	},
	variants: {
		place: {
			1: { podiumBar: "bg-primary", podiumCard: "mb-3", podiumCardRank: "bg-primary" },
			2: { podiumBar: "bg-primary/70", podiumCardRank: "bg-primary/70" },
			3: { podiumBar: "bg-primary/45", podiumCardRank: "bg-primary/45" },
		},
		isHighlighted: {
			true: { row: "bg-primary/10", podiumCard: "border-primary" },
			false: {},
		},
		movement: {
			up: { movementText: "text-success-soft-foreground" },
			down: { movementText: "text-destructive" },
			same: { movementText: "text-muted-foreground" },
			none: {},
		},
	},
	defaultVariants: {
		isHighlighted: false,
		movement: "none",
	},
});

export type LeaderboardVariantProps = VariantProps<typeof leaderboardVariants>;

/** Sorts a not-a-number value after every number, in either order. */
function compareValues(a: number, b: number, order: LeaderboardOrder): number {
	const aMissing = Number.isNaN(a);
	const bMissing = Number.isNaN(b);
	if (aMissing || bMissing) return Number(aMissing) - Number(bMissing);
	if (a === b) return 0;
	return order === "desc" ? b - a : a - b;
}

/**
 * Ranks the board: a stable sort by value, then standard competition ranking —
 * `1, 2, 2, 4`. Tied entries keep the order the caller passed them in, and
 * share the rank of the first of them.
 *
 * A value that is not a number sorts last and is never tied — `NaN` equals
 * nothing, so two of them are two unknowns rather than one shared score.
 */
export function rankLeaderboard(data: readonly LeaderboardEntry[], order: LeaderboardOrder): RankedEntry[] {
	const sorted = [...data].sort((a, b) => compareValues(a.value, b.value, order));
	const ranks: number[] = [];

	for (let i = 0; i < sorted.length; i++) {
		const current = sorted[i];
		const previous = sorted[i - 1];
		const previousRank = ranks[i - 1];
		const sharesPrevious = current !== undefined && previous !== undefined && current.value === previous.value;
		ranks.push(sharesPrevious && previousRank !== undefined ? previousRank : i + 1);
	}

	return sorted.map((entry, i) => {
		const sameAsPrevious = sorted[i - 1]?.value === entry.value;
		const sameAsNext = sorted[i + 1]?.value === entry.value;
		return { entry, rank: ranks[i] ?? i + 1, isTied: sameAsPrevious || sameAsNext };
	});
}

/** The podium the board can actually draw: any podium needs three entries, or it is all rows. */
export function resolveLeaderboardPodium(podium: LeaderboardPodium, count: number): LeaderboardPodium {
	return count < LEADERBOARD_PODIUM_SIZE ? "none" : podium;
}

/**
 * Splits the ranked board into the podium and the rows under it.
 *
 * The podium takes the first three **positions**, not the first three ranks —
 * a four-way tie for first puts three on the podium and the fourth, still
 * ranked first, at the head of the rows. Ranking by position is the only split
 * that always fills exactly three places.
 */
export function splitPodium(
	ranked: readonly RankedEntry[],
	podium: LeaderboardPodium
): { podium: RankedEntry[]; rows: RankedEntry[] } {
	if (resolveLeaderboardPodium(podium, ranked.length) === "none") {
		return { podium: [], rows: [...ranked] };
	}
	return { podium: ranked.slice(0, LEADERBOARD_PODIUM_SIZE), rows: ranked.slice(LEADERBOARD_PODIUM_SIZE) };
}

/** Rank order to visual order — second, first, third — so the leader stands in the middle. */
export function resolvePodiumOrder<T>(podium: readonly T[]): T[] {
	const [first, second, third] = podium;
	if (podium.length !== LEADERBOARD_PODIUM_SIZE || first === undefined || second === undefined || third === undefined) {
		return [...podium];
	}
	return [second, first, third];
}

/** A podium entry's tone, by its rank — two tied firsts share the first tone. */
export function resolvePodiumPlace(rank: number): LeaderboardPlace {
	if (rank <= 1) return 1;
	if (rank === 2) return 2;
	return 3;
}

/**
 * The scale the bars actually use. Ascending boards force `rank`: smaller is
 * better there, so a bar proportional to the value would draw the winner
 * shortest and invert what the podium means.
 */
export function resolvePodiumScale(scale: LeaderboardPodiumScale, order: LeaderboardOrder): LeaderboardPodiumScale {
	return order === "asc" ? "rank" : scale;
}

function roundPoints(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Each podium bar's height, in rank order, as points.
 *
 * `rank` is a fixed 100 / 75 / 55 percent by **rank**, so tied entries stand
 * level. `value` is proportional to the leader with a floor of 35 percent, so a
 * third far behind is still a bar rather than a sliver. A leader at zero or
 * below has nothing to be proportional to, and falls back to `rank`.
 */
export function resolvePodiumHeights(
	podium: readonly RankedEntry[],
	scale: LeaderboardPodiumScale,
	order: LeaderboardOrder,
	max: number
): number[] {
	const leader = podium[0]?.entry.value ?? 0;
	const effective = resolvePodiumScale(scale, order);

	if (effective === "value" && Number.isFinite(leader) && leader > 0) {
		return podium.map(({ entry }) => {
			const ratio = Number.isFinite(entry.value) ? entry.value / leader : 0;
			return roundPoints(max * Math.min(1, Math.max(LEADERBOARD_MIN_BAR_RATIO, ratio)));
		});
	}

	return podium.map(({ rank }) => {
		const ratio = LEADERBOARD_RANK_BAR_RATIOS[resolvePodiumPlace(rank) - 1] ?? LEADERBOARD_MIN_BAR_RATIO;
		return roundPoints(max * ratio);
	});
}

/**
 * Each bar's start delay, in rank order: the third grows first, then the
 * second, and the leader last — the reveal ends on the winner.
 */
export function resolvePodiumDelays(): number[] {
	return Array.from(
		{ length: LEADERBOARD_PODIUM_SIZE },
		(_, i) => (LEADERBOARD_PODIUM_SIZE - 1 - i) * LEADERBOARD_BAR_STAGGER_MS
	);
}

/**
 * Cuts the board to `limit` places — the podium counts — and pins the
 * highlighted entry after the cut if it fell below it.
 *
 * The pin keeps its true rank: someone fourteenth is told they are fourteenth,
 * not sixth. A limit that is not finite is no limit; a fraction floors; zero or
 * below shows nothing but the pin.
 */
export function applyLeaderboardLimit(
	ranked: readonly RankedEntry[],
	limit: number | undefined,
	highlightId: string | undefined
): { rows: RankedEntry[]; pinned?: RankedEntry } {
	if (limit === undefined || !Number.isFinite(limit)) return { rows: [...ranked] };

	const count = Math.max(0, Math.floor(limit));
	if (count >= ranked.length) return { rows: [...ranked] };

	const rows = ranked.slice(0, count);
	if (highlightId === undefined) return { rows };

	const index = ranked.findIndex((r) => r.entry.id === highlightId);
	const pinned = index >= count ? ranked[index] : undefined;
	return pinned ? { rows, pinned } : { rows };
}

/** Which way an entry moved since the last period, in whole places. */
export type LeaderboardMovement = { kind: "up" | "down"; places: number } | { kind: "same" } | { kind: "none" };

/**
 * The theme token a movement glyph is drawn in, matching `movementText` —
 * an `Icon` takes its colour as a token, not a class.
 */
export const LEADERBOARD_MOVEMENT_COLOR: Record<"up" | "down" | "same", string> = {
	up: "success-soft-foreground",
	down: "destructive",
	same: "muted-foreground",
};

/** Reads an entry's `change`: positive climbed, negative fell, zero held, absent says nothing. */
export function resolveMovement(change: number | undefined): LeaderboardMovement {
	if (change === undefined || !Number.isFinite(change)) return { kind: "none" };
	const places = Math.round(Math.abs(change));
	if (places === 0) return { kind: "same" };
	return { kind: change > 0 ? "up" : "down", places };
}

/** The movement as words — "up 3 places", "no change" — or nothing when there is none. */
export function resolveMovementLabel(movement: LeaderboardMovement): string | undefined {
	switch (movement.kind) {
		case "up":
		case "down":
			return `${movement.kind} ${movement.places} ${movement.places === 1 ? "place" : "places"}`;
		case "same":
			return "no change";
		case "none":
			return undefined;
	}
}

/** Whether the movement column is drawn at all — only when some entry has a `change`. */
export function hasMovementColumn(data: readonly LeaderboardEntry[]): boolean {
	return data.some((entry) => entry.change !== undefined);
}

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats a score with the locale's grouping and up to two fraction digits —
 * `1,240`, `61.24`. The formatter is cached per locale; building one per row
 * per render is measurable on a long board.
 */
export function defaultFormatValue(value: number, locale?: string): string {
	const key = locale ?? "";
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
		formatters.set(key, formatter);
	}
	return formatter.format(value);
}

/**
 * One place, as one sentence — "Rank 2, tied, Ngaio, 1,240 points, up 3
 * places". Rank comes first because it is what a board is for; the unit
 * follows the value because a bare number is not a score.
 */
export function resolveLeaderboardAccessibilityLabel({
	ranked,
	formattedValue,
	unit,
}: {
	ranked: RankedEntry;
	formattedValue: string;
	unit?: string;
}): string {
	const { entry, rank, isTied } = ranked;
	const parts = [
		`Rank ${rank}`,
		isTied ? "tied" : undefined,
		entry.name,
		entry.subtitle,
		unit ? `${formattedValue} ${unit}` : formattedValue,
		resolveMovementLabel(resolveMovement(entry.change)),
	];
	return parts.filter((part): part is string => part !== undefined && part !== "").join(", ");
}
