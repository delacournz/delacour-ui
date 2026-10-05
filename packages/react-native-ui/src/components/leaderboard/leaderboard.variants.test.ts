import { describe, expect, test } from "bun:test";
import type { LeaderboardEntry, RankedEntry } from "./leaderboard.types";
import {
	applyLeaderboardLimit,
	defaultFormatValue,
	hasMovementColumn,
	LEADERBOARD_BAR_DURATION_MS,
	LEADERBOARD_BAR_STAGGER_MS,
	LEADERBOARD_DEFAULT_PODIUM_HEIGHT,
	LEADERBOARD_MIN_BAR_RATIO,
	LEADERBOARD_ORDERS,
	LEADERBOARD_PODIUM_SCALES,
	LEADERBOARD_PODIUMS,
	LEADERBOARD_RANK_BAR_RATIOS,
	leaderboardVariants,
	rankLeaderboard,
	resolveLeaderboardAccessibilityLabel,
	resolveLeaderboardPodium,
	resolveMovement,
	resolveMovementLabel,
	resolvePodiumDelays,
	resolvePodiumHeights,
	resolvePodiumOrder,
	resolvePodiumPlace,
	resolvePodiumScale,
	splitPodium,
} from "./leaderboard.variants";

function entry(id: string, value: number, extra: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
	return { id, name: id.toUpperCase(), value, ...extra };
}

function ids(ranked: readonly RankedEntry[]): string[] {
	return ranked.map((r) => r.entry.id);
}

function ranks(ranked: readonly RankedEntry[]): number[] {
	return ranked.map((r) => r.rank);
}

/** Ten entries, `e1` the highest, `e10` the lowest, with no ties. */
const TEN = Array.from({ length: 10 }, (_, i) => entry(`e${i + 1}`, 1000 - i * 10));

describe("axes", () => {
	test("each tuple names its members exactly", () => {
		expect(LEADERBOARD_PODIUMS).toEqual(["bars", "cards", "none"]);
		expect(LEADERBOARD_ORDERS).toEqual(["desc", "asc"]);
		expect(LEADERBOARD_PODIUM_SCALES).toEqual(["value", "rank"]);
	});

	test("the motion constants are the spec's", () => {
		expect(LEADERBOARD_BAR_DURATION_MS).toBe(500);
		expect(LEADERBOARD_BAR_STAGGER_MS).toBe(80);
		expect(LEADERBOARD_DEFAULT_PODIUM_HEIGHT).toBe(132);
		expect(LEADERBOARD_MIN_BAR_RATIO).toBe(0.35);
		expect(LEADERBOARD_RANK_BAR_RATIOS).toEqual([1, 0.75, 0.55]);
	});
});

describe("rankLeaderboard", () => {
	test("desc puts the largest value first", () => {
		const ranked = rankLeaderboard([entry("a", 10), entry("b", 30), entry("c", 20)], "desc");
		expect(ids(ranked)).toEqual(["b", "c", "a"]);
		expect(ranks(ranked)).toEqual([1, 2, 3]);
		expect(ranked.every((r) => !r.isTied)).toBe(true);
	});

	test("asc puts the smallest value first", () => {
		const ranked = rankLeaderboard([entry("a", 10), entry("b", 30), entry("c", 20)], "asc");
		expect(ids(ranked)).toEqual(["a", "c", "b"]);
		expect(ranks(ranked)).toEqual([1, 2, 3]);
	});

	test("ties share a rank and the next rank skips — 1, 2, 2, 4", () => {
		const ranked = rankLeaderboard([entry("a", 50), entry("b", 40), entry("c", 40), entry("d", 30)], "desc");
		expect(ranks(ranked)).toEqual([1, 2, 2, 4]);
		expect(ranked.map((r) => r.isTied)).toEqual([false, true, true, false]);
	});

	test("ties keep input order — the sort is stable", () => {
		const ranked = rankLeaderboard([entry("z", 5), entry("y", 9), entry("x", 5), entry("w", 5)], "desc");
		expect(ids(ranked)).toEqual(["y", "z", "x", "w"]);
		expect(ranks(ranked)).toEqual([1, 2, 2, 2]);
	});

	test("ties keep input order in asc too", () => {
		const ranked = rankLeaderboard([entry("z", 5), entry("y", 1), entry("x", 5)], "asc");
		expect(ids(ranked)).toEqual(["y", "z", "x"]);
		expect(ranks(ranked)).toEqual([1, 2, 2]);
	});

	test("all tied: every entry is first and tied", () => {
		const ranked = rankLeaderboard([entry("a", 7), entry("b", 7), entry("c", 7), entry("d", 7)], "desc");
		expect(ids(ranked)).toEqual(["a", "b", "c", "d"]);
		expect(ranks(ranked)).toEqual([1, 1, 1, 1]);
		expect(ranked.every((r) => r.isTied)).toBe(true);
	});

	test("a tie at the top: two firsts, then third", () => {
		const ranked = rankLeaderboard([entry("a", 9), entry("b", 9), entry("c", 3)], "desc");
		expect(ranks(ranked)).toEqual([1, 1, 3]);
	});

	test("empty and single entries", () => {
		expect(rankLeaderboard([], "desc")).toEqual([]);
		const one = rankLeaderboard([entry("a", 1)], "desc");
		expect(one).toEqual([{ entry: entry("a", 1), rank: 1, isTied: false }]);
	});

	test("does not mutate the caller's array", () => {
		const data = [entry("a", 1), entry("b", 2)];
		const copy = [...data];
		rankLeaderboard(data, "desc");
		expect(data).toEqual(copy);
	});

	test("a value that is not a number sorts last in either order, untied", () => {
		const data = [entry("nan", Number.NaN), entry("a", 1), entry("b", 2)];
		expect(ids(rankLeaderboard(data, "desc"))).toEqual(["b", "a", "nan"]);
		expect(ids(rankLeaderboard(data, "asc"))).toEqual(["a", "b", "nan"]);
		const twoNaN = rankLeaderboard([entry("x", Number.NaN), entry("y", Number.NaN)], "desc");
		expect(twoNaN.every((r) => !r.isTied)).toBe(true);
		expect(ranks(twoNaN)).toEqual([1, 2]);
	});

	test("negative values rank like any other number", () => {
		const ranked = rankLeaderboard([entry("a", -5), entry("b", 0), entry("c", -1)], "desc");
		expect(ids(ranked)).toEqual(["b", "c", "a"]);
	});
});

describe("resolveLeaderboardPodium", () => {
	test("keeps the podium with three or more entries", () => {
		for (const podium of LEADERBOARD_PODIUMS) {
			expect(resolveLeaderboardPodium(podium, 3)).toBe(podium);
			expect(resolveLeaderboardPodium(podium, 10)).toBe(podium);
		}
	});

	test("falls back to none with fewer than three", () => {
		for (const count of [0, 1, 2]) {
			expect(resolveLeaderboardPodium("bars", count)).toBe("none");
			expect(resolveLeaderboardPodium("cards", count)).toBe("none");
		}
	});
});

describe("splitPodium", () => {
	const ranked = rankLeaderboard(TEN, "desc");

	test("the top three positions go on the podium, rows start at index 3", () => {
		const { podium, rows } = splitPodium(ranked, "bars");
		expect(ids(podium)).toEqual(["e1", "e2", "e3"]);
		expect(ids(rows)).toEqual(["e4", "e5", "e6", "e7", "e8", "e9", "e10"]);
	});

	test("none puts everything in rows", () => {
		const { podium, rows } = splitPodium(ranked, "none");
		expect(podium).toEqual([]);
		expect(rows).toHaveLength(10);
	});

	test("fewer than three entries never form a podium", () => {
		const two = rankLeaderboard([entry("a", 2), entry("b", 1)], "desc");
		const { podium, rows } = splitPodium(two, "cards");
		expect(podium).toEqual([]);
		expect(ids(rows)).toEqual(["a", "b"]);
	});

	test("exactly three: a podium and no rows", () => {
		const three = rankLeaderboard([entry("a", 3), entry("b", 2), entry("c", 1)], "desc");
		const { podium, rows } = splitPodium(three, "bars");
		expect(ids(podium)).toEqual(["a", "b", "c"]);
		expect(rows).toEqual([]);
	});

	test("the podium is by position, not rank — a four-way tie fills it with the first three", () => {
		const tied = rankLeaderboard([entry("a", 7), entry("b", 7), entry("c", 7), entry("d", 7)], "desc");
		const { podium, rows } = splitPodium(tied, "bars");
		expect(ids(podium)).toEqual(["a", "b", "c"]);
		expect(ids(rows)).toEqual(["d"]);
		expect(rows[0]?.rank).toBe(1);
	});
});

describe("resolvePodiumOrder", () => {
	test("visual order is second, first, third", () => {
		expect(resolvePodiumOrder(["first", "second", "third"])).toEqual(["second", "first", "third"]);
	});

	test("anything but three is returned as is", () => {
		expect(resolvePodiumOrder([])).toEqual([]);
		expect(resolvePodiumOrder(["a", "b"])).toEqual(["a", "b"]);
	});
});

describe("resolvePodiumPlace", () => {
	test("maps a rank onto the three podium tones", () => {
		expect(resolvePodiumPlace(1)).toBe(1);
		expect(resolvePodiumPlace(2)).toBe(2);
		expect(resolvePodiumPlace(3)).toBe(3);
	});
});

describe("resolvePodiumScale", () => {
	test("desc keeps the caller's scale", () => {
		expect(resolvePodiumScale("value", "desc")).toBe("value");
		expect(resolvePodiumScale("rank", "desc")).toBe("rank");
	});

	test("asc forces rank", () => {
		expect(resolvePodiumScale("value", "asc")).toBe("rank");
		expect(resolvePodiumScale("rank", "asc")).toBe("rank");
	});
});

describe("resolvePodiumHeights", () => {
	const podium = (values: number[]): RankedEntry[] =>
		splitPodium(
			rankLeaderboard(
				values.map((v, i) => entry(`p${i}`, v)),
				"desc"
			),
			"bars"
		).podium;

	test("rank scale is 100 / 75 / 55 percent of the tallest", () => {
		expect(resolvePodiumHeights(podium([300, 200, 100]), "rank", "desc", 100)).toEqual([100, 75, 55]);
	});

	test("value scale is proportional to the leader", () => {
		expect(resolvePodiumHeights(podium([200, 150, 100]), "value", "desc", 100)).toEqual([100, 75, 50]);
	});

	test("value scale floors a tiny third at 35 percent", () => {
		expect(resolvePodiumHeights(podium([1000, 900, 10]), "value", "desc", 100)).toEqual([100, 90, 35]);
	});

	test("asc forces the rank scale", () => {
		const laps = splitPodium(rankLeaderboard([entry("a", 61), entry("b", 62), entry("c", 70)], "asc"), "bars").podium;
		expect(resolvePodiumHeights(laps, "value", "asc", 132)).toEqual([132, 99, 72.6]);
	});

	test("ties share a height on the rank scale", () => {
		expect(resolvePodiumHeights(podium([9, 9, 3]), "rank", "desc", 100)).toEqual([100, 100, 55]);
		expect(resolvePodiumHeights(podium([9, 5, 5]), "rank", "desc", 100)).toEqual([100, 75, 75]);
	});

	test("a leader of zero or below falls back to the rank scale", () => {
		expect(resolvePodiumHeights(podium([0, 0, 0]), "value", "desc", 100)).toEqual([100, 100, 100]);
		expect(resolvePodiumHeights(podium([-1, -2, -3]), "value", "desc", 100)).toEqual([100, 75, 55]);
	});

	test("a negative non-leader floors rather than going below zero", () => {
		expect(resolvePodiumHeights(podium([10, 5, -4]), "value", "desc", 100)).toEqual([100, 50, 35]);
	});

	test("every height is within [floor, max]", () => {
		const heights = resolvePodiumHeights(podium([500, 499, 0]), "value", "desc", 132);
		for (const h of heights) {
			expect(h).toBeGreaterThanOrEqual(132 * LEADERBOARD_MIN_BAR_RATIO);
			expect(h).toBeLessThanOrEqual(132);
		}
	});

	test("an empty podium has no heights", () => {
		expect(resolvePodiumHeights([], "value", "desc", 100)).toEqual([]);
	});
});

describe("resolvePodiumDelays", () => {
	test("third grows first, then second, then first — by rank position", () => {
		expect(resolvePodiumDelays()).toEqual([160, 80, 0]);
	});
});

describe("applyLeaderboardLimit", () => {
	const ranked = rankLeaderboard(TEN, "desc");

	test("no limit keeps everything and pins nothing", () => {
		expect(applyLeaderboardLimit(ranked, undefined, "e9")).toEqual({ rows: ranked });
	});

	test("a limit cuts to the first n places", () => {
		const { rows, pinned } = applyLeaderboardLimit(ranked, 5, undefined);
		expect(ids(rows)).toEqual(["e1", "e2", "e3", "e4", "e5"]);
		expect(pinned).toBeUndefined();
	});

	test("a highlighted entry that was cut is pinned with its true rank", () => {
		const { rows, pinned } = applyLeaderboardLimit(ranked, 5, "e9");
		expect(rows).toHaveLength(5);
		expect(pinned?.entry.id).toBe("e9");
		expect(pinned?.rank).toBe(9);
	});

	test("a highlighted entry inside the limit is not pinned", () => {
		expect(applyLeaderboardLimit(ranked, 5, "e5").pinned).toBeUndefined();
	});

	test("a highlighted entry on the podium is not pinned", () => {
		expect(applyLeaderboardLimit(ranked, 5, "e1").pinned).toBeUndefined();
	});

	test("an unknown highlight pins nothing", () => {
		expect(applyLeaderboardLimit(ranked, 5, "nobody").pinned).toBeUndefined();
	});

	test("a limit at or beyond the length cuts nothing", () => {
		expect(applyLeaderboardLimit(ranked, 10, "e10")).toEqual({ rows: ranked });
		expect(applyLeaderboardLimit(ranked, 50, "e10")).toEqual({ rows: ranked });
	});

	test("a pinned tie keeps its shared rank", () => {
		const tied = rankLeaderboard([...TEN.slice(0, 6), entry("me", 950), entry("x", 950)], "desc");
		const { pinned } = applyLeaderboardLimit(tied, 6, "x");
		expect(pinned?.rank).toBe(tied.find((r) => r.entry.id === "x")?.rank);
		expect(pinned?.isTied).toBe(true);
	});

	test("a limit of zero or less shows nothing but the pin", () => {
		const { rows, pinned } = applyLeaderboardLimit(ranked, 0, "e2");
		expect(rows).toEqual([]);
		expect(pinned?.entry.id).toBe("e2");
		expect(applyLeaderboardLimit(ranked, -3, undefined).rows).toEqual([]);
	});

	test("a fractional limit floors; a non-finite one is no limit", () => {
		expect(applyLeaderboardLimit(ranked, 3.9, undefined).rows).toHaveLength(3);
		expect(applyLeaderboardLimit(ranked, Number.POSITIVE_INFINITY, undefined).rows).toHaveLength(10);
		expect(applyLeaderboardLimit(ranked, Number.NaN, undefined).rows).toHaveLength(10);
	});
});

describe("resolveMovement", () => {
	test("positive climbs, negative falls, zero holds", () => {
		expect(resolveMovement(3)).toEqual({ kind: "up", places: 3 });
		expect(resolveMovement(-2)).toEqual({ kind: "down", places: 2 });
		expect(resolveMovement(0)).toEqual({ kind: "same" });
	});

	test("absent or not finite is none", () => {
		expect(resolveMovement(undefined)).toEqual({ kind: "none" });
		expect(resolveMovement(Number.NaN)).toEqual({ kind: "none" });
		expect(resolveMovement(Number.POSITIVE_INFINITY)).toEqual({ kind: "none" });
	});

	test("a fraction rounds to whole places", () => {
		expect(resolveMovement(2.6)).toEqual({ kind: "up", places: 3 });
		expect(resolveMovement(-0.4)).toEqual({ kind: "same" });
	});
});

describe("resolveMovementLabel", () => {
	test("singular and plural places", () => {
		expect(resolveMovementLabel({ kind: "up", places: 1 })).toBe("up 1 place");
		expect(resolveMovementLabel({ kind: "up", places: 3 })).toBe("up 3 places");
		expect(resolveMovementLabel({ kind: "down", places: 2 })).toBe("down 2 places");
		expect(resolveMovementLabel({ kind: "same" })).toBe("no change");
		expect(resolveMovementLabel({ kind: "none" })).toBeUndefined();
	});
});

describe("hasMovementColumn", () => {
	test("hidden when no entry has a change", () => {
		expect(hasMovementColumn([entry("a", 1), entry("b", 2)])).toBe(false);
		expect(hasMovementColumn([])).toBe(false);
	});

	test("shown when any entry has one, zero included", () => {
		expect(hasMovementColumn([entry("a", 1), entry("b", 2, { change: 0 })])).toBe(true);
	});
});

describe("defaultFormatValue", () => {
	test("groups thousands", () => {
		expect(defaultFormatValue(1240, "en-US")).toBe("1,240");
		expect(defaultFormatValue(1234567, "en-US")).toBe("1,234,567");
	});

	test("keeps up to two fraction digits", () => {
		expect(defaultFormatValue(61.237, "en-US")).toBe("61.24");
		expect(defaultFormatValue(5, "en-US")).toBe("5");
	});

	test("formats with the device locale when none is given", () => {
		expect(typeof defaultFormatValue(1240)).toBe("string");
	});
});

describe("resolveLeaderboardAccessibilityLabel", () => {
	test("the full sentence — rank, tied, name, value, unit, movement", () => {
		expect(
			resolveLeaderboardAccessibilityLabel({
				ranked: { entry: entry("aroha", 1240, { name: "Aroha", change: 3 }), rank: 2, isTied: true },
				formattedValue: "1,240",
				unit: "points",
			})
		).toBe("Rank 2, tied, Aroha, 1,240 points, up 3 places");
	});

	test("drops what is absent", () => {
		expect(
			resolveLeaderboardAccessibilityLabel({
				ranked: { entry: entry("a", 5, { name: "Mere" }), rank: 1, isTied: false },
				formattedValue: "5",
			})
		).toBe("Rank 1, Mere, 5");
	});

	test("reads the subtitle after the name", () => {
		expect(
			resolveLeaderboardAccessibilityLabel({
				ranked: { entry: entry("a", 5, { name: "Mere", subtitle: "Team Kea" }), rank: 4, isTied: false },
				formattedValue: "5",
				unit: "laps",
			})
		).toBe("Rank 4, Mere, Team Kea, 5 laps");
	});

	test("says down and no change", () => {
		const base = { formattedValue: "9", unit: "points" } as const;
		expect(
			resolveLeaderboardAccessibilityLabel({
				...base,
				ranked: { entry: entry("a", 9, { name: "A", change: -1 }), rank: 3, isTied: false },
			})
		).toBe("Rank 3, A, 9 points, down 1 place");
		expect(
			resolveLeaderboardAccessibilityLabel({
				...base,
				ranked: { entry: entry("a", 9, { name: "A", change: 0 }), rank: 3, isTied: false },
			})
		).toBe("Rank 3, A, 9 points, no change");
	});
});

describe("leaderboardVariants", () => {
	const slots = leaderboardVariants();

	test("rank and value are tabular", () => {
		expect(slots.rowRank()).toContain("tabular-nums");
		expect(slots.rowValue()).toContain("tabular-nums");
		expect(slots.podiumValue()).toContain("tabular-nums");
	});

	test("the rank column has a fixed width so names line up", () => {
		expect(slots.rowRank()).toMatch(/\bw-\d+\b/);
	});

	test("a highlighted row is primary at 10 percent", () => {
		expect(leaderboardVariants({ isHighlighted: true }).row()).toContain("bg-primary/10");
		expect(leaderboardVariants({ isHighlighted: false }).row()).not.toContain("bg-primary");
	});

	test("the three bar tones are primary at 100 / 70 / 45 percent — never a metal", () => {
		expect(leaderboardVariants({ place: 1 }).podiumBar()).toMatch(/\bbg-primary(\s|$)/);
		expect(leaderboardVariants({ place: 2 }).podiumBar()).toContain("bg-primary/70");
		expect(leaderboardVariants({ place: 3 }).podiumBar()).toContain("bg-primary/45");
		for (const place of [1, 2, 3] as const) {
			expect(leaderboardVariants({ place }).podiumBar()).not.toMatch(/gold|silver|bronze|amber|yellow|orange/);
		}
	});

	test("movement is coloured by direction", () => {
		expect(leaderboardVariants({ movement: "up" }).movementText()).toContain("text-success-soft-foreground");
		expect(leaderboardVariants({ movement: "down" }).movementText()).toContain("text-destructive");
		expect(leaderboardVariants({ movement: "same" }).movementText()).toContain("text-muted-foreground");
	});

	test("the cards podium raises the leader by 12pt", () => {
		expect(leaderboardVariants({ place: 1 }).podiumCard()).toContain("-mt-3");
		expect(leaderboardVariants({ place: 2 }).podiumCard()).not.toContain("-mt-3");
	});

	test("no view slot carries a text colour or size (rule 1)", () => {
		const viewSlots = [
			"root",
			"podium",
			"podiumPlace",
			"podiumBar",
			"podiumCard",
			"podiumMedia",
			"rows",
			"row",
			"rowMedia",
			"rowBody",
			"movement",
			"separator",
		] as const;
		for (const isHighlighted of [true, false]) {
			for (const place of [1, 2, 3] as const) {
				const variant = leaderboardVariants({ isHighlighted, place });
				for (const slot of viewSlots) {
					expect(variant[slot]()).not.toMatch(/\btext-(?!center|left|right)/);
				}
			}
		}
	});
});
