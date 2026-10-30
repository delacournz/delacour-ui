import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { TABS_PAN } from "../tabs/tabs.variants";
import type { PlannerCategory, PlannerEntry } from "./planner.types";
import {
	countByCategory,
	groupEntriesByDay,
	PLANNER_COLOR_INDEXES,
	PLANNER_PAN,
	PLANNER_VARIANTS,
	plannerVariants,
	resolveDayDisplay,
	resolveEntryColor,
	resolveEntryLimit,
	resolvePlannerDayLabel,
	resolveSwipePage,
} from "./planner.variants";

const previousTimeZone = process.env.TZ;
beforeAll(() => {
	process.env.TZ = "Pacific/Auckland";
});
afterAll(() => {
	process.env.TZ = previousTimeZone;
});

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "run", label: "Run", colorIndex: 1 },
	{ id: "strength", label: "Strength", colorIndex: 2 },
	{ id: "race", label: "Race", color: "#EC4899" },
	{ id: "rest", label: "Rest" },
];

function entry(id: string, date: Date | string, category?: string, extra: Partial<PlannerEntry> = {}): PlannerEntry {
	return { id, date, label: id, category, ...extra };
}

describe("groupEntriesByDay", () => {
	test("keys entries by local calendar day, keeping their order", () => {
		const grouped = groupEntriesByDay([
			entry("a", "2026-10-14"),
			entry("b", new Date(2026, 9, 14, 23, 30)),
			entry("c", "2026-10-15"),
			entry("d", new Date(2026, 9, 14, 0, 5)),
		]);
		expect(grouped.get("2026-10-14")?.map((e) => e.id)).toEqual(["a", "b", "d"]);
		expect(grouped.get("2026-10-15")?.map((e) => e.id)).toEqual(["c"]);
		expect(grouped.size).toBe(2);
	});

	test("never shifts an entry across Auckland's daylight-saving nights", () => {
		const grouped = groupEntriesByDay([
			entry("before-april", new Date(2026, 3, 4, 23, 59)),
			entry("april", "2026-04-05"),
			entry("april-late", new Date(2026, 3, 5, 23, 59)),
			entry("september", "2026-09-27"),
			entry("september-early", new Date(2026, 8, 27, 0, 0)),
		]);
		expect(grouped.get("2026-04-04")?.map((e) => e.id)).toEqual(["before-april"]);
		expect(grouped.get("2026-04-05")?.map((e) => e.id)).toEqual(["april", "april-late"]);
		expect(grouped.get("2026-09-27")?.map((e) => e.id)).toEqual(["september", "september-early"]);
	});
});

describe("resolveEntryLimit", () => {
	test("defaults to two, three on the calendar", () => {
		expect(resolveEntryLimit("default")).toBe(2);
		expect(resolveEntryLimit("tiles")).toBe(2);
		expect(resolveEntryLimit("calendar")).toBe(3);
	});

	test("a caller's limit wins, floored at one", () => {
		expect(resolveEntryLimit("default", 4)).toBe(4);
		expect(resolveEntryLimit("calendar", 0)).toBe(1);
		expect(resolveEntryLimit("default", 2.7)).toBe(2);
	});
});

describe("resolveDayDisplay", () => {
	const five = ["a", "b", "c", "d", "e"].map((id) => entry(id, "2026-10-14"));

	test("default shows up to the limit and counts the rest", () => {
		expect(resolveDayDisplay(five, "default", 2)).toEqual({ shown: five.slice(0, 2), overflow: 3 });
		expect(resolveDayDisplay(five.slice(0, 2), "default", 2)).toEqual({ shown: five.slice(0, 2), overflow: 0 });
	});

	// Four entries at a limit of three drew three blocks and a "+1 more" line —
	// four lines in a cell sized for three, spilling into the week below.
	test("calendar's \"+N more\" takes the last of the limit's lines, so a day never draws more than the limit", () => {
		expect(resolveDayDisplay(five, "calendar", 3)).toEqual({ shown: five.slice(0, 2), overflow: 3 });
		expect(resolveDayDisplay(five.slice(0, 4), "calendar", 3)).toEqual({ shown: five.slice(0, 2), overflow: 2 });
		for (let limit = 1; limit <= 5; limit++) {
			for (let count = 0; count <= 5; count++) {
				const { shown, overflow } = resolveDayDisplay(five.slice(0, count), "calendar", limit);
				expect(shown.length + (overflow > 0 ? 1 : 0)).toBeLessThanOrEqual(Math.max(limit, 1));
				expect(shown.length + overflow).toBe(count);
			}
		}
	});

	test("a calendar limit of one is all overflow line once there is more than one entry", () => {
		expect(resolveDayDisplay(five.slice(0, 1), "calendar", 1)).toEqual({ shown: five.slice(0, 1), overflow: 0 });
		expect(resolveDayDisplay(five.slice(0, 2), "calendar", 1)).toEqual({ shown: [], overflow: 2 });
	});

	test("a full limit is not reported as overflow", () => {
		expect(resolveDayDisplay(five.slice(0, 3), "calendar", 3).overflow).toBe(0);
	});

	test("tiles draw one icon, whatever the limit, and count the rest", () => {
		expect(resolveDayDisplay(five, "tiles", 4)).toEqual({ shown: five.slice(0, 1), overflow: 4 });
	});

	test("an empty day shows nothing", () => {
		for (const variant of PLANNER_VARIANTS) {
			expect(resolveDayDisplay([], variant, 2)).toEqual({ shown: [], overflow: 0 });
		}
	});
});

describe("resolveEntryColor", () => {
	test("a category's colorIndex maps to its chart slot", () => {
		expect(resolveEntryColor(entry("a", "2026-10-14", "strength"), CATEGORIES)).toEqual({ kind: "chart", index: 2 });
	});

	test("a category's literal colour passes through", () => {
		expect(resolveEntryColor(entry("a", "2026-10-14", "race"), CATEGORIES)).toEqual({
			kind: "literal",
			color: "#EC4899",
		});
	});

	test("an entry's own colour beats its category's", () => {
		expect(resolveEntryColor(entry("a", "2026-10-14", "run", { color: "#000000" }), CATEGORIES)).toEqual({
			kind: "literal",
			color: "#000000",
		});
	});

	test("no category, an unknown one, or one with no colour is the default", () => {
		expect(resolveEntryColor(entry("a", "2026-10-14"), CATEGORIES)).toEqual({ kind: "default" });
		expect(resolveEntryColor(entry("a", "2026-10-14", "missing"), CATEGORIES)).toEqual({ kind: "default" });
		expect(resolveEntryColor(entry("a", "2026-10-14", "rest"), CATEGORIES)).toEqual({ kind: "default" });
		expect(resolveEntryColor(entry("a", "2026-10-14", "run"), undefined)).toEqual({ kind: "default" });
	});
});

describe("countByCategory", () => {
	const entries = [
		entry("a", "2026-10-01", "run"),
		entry("b", "2026-10-14", "run"),
		entry("c", "2026-10-31", "strength"),
		entry("d", "2026-11-01", "run"),
		entry("e", "2026-09-30", "strength"),
		entry("f", "2026-10-20"),
		entry("g", "2026-10-21", "missing"),
	];

	test("counts only the displayed month, in category order, zeros included", () => {
		const result = countByCategory(entries, new Date(2026, 9, 18), CATEGORIES);
		expect(result.items.map((item) => [item.category.id, item.count])).toEqual([
			["run", 2],
			["strength", 1],
			["race", 0],
			["rest", 0],
		]);
		expect(result.uncategorized).toBe(2);
		expect(result.total).toBe(5);
	});

	test("an empty month is all zeros", () => {
		const result = countByCategory(entries, new Date(2027, 0, 1), CATEGORIES);
		expect(result.total).toBe(0);
		expect(result.items.every((item) => item.count === 0)).toBe(true);
	});
});

describe("resolvePlannerDayLabel", () => {
	const date = new Date(2026, 9, 14);

	test("reads the date, the count and each category once", () => {
		const label = resolvePlannerDayLabel({
			date,
			entries: [entry("a", date, "run"), entry("b", date, "strength"), entry("c", date, "run")],
			categories: CATEGORIES,
			isToday: false,
			locale: "en-NZ",
		});
		expect(label).toBe("Wednesday, 14 October, 3 entries, Run, Strength");
	});

	test("an uncategorised entry is named by its own label", () => {
		const label = resolvePlannerDayLabel({
			date,
			entries: [entry("Physio", date)],
			categories: CATEGORIES,
			isToday: false,
			locale: "en-NZ",
		});
		expect(label).toBe("Wednesday, 14 October, 1 entry, Physio");
	});

	test("an empty day reads its date, and today says so", () => {
		expect(resolvePlannerDayLabel({ date, entries: [], categories: CATEGORIES, isToday: true, locale: "en-NZ" })).toBe(
			"Wednesday, 14 October, no entries, today"
		);
	});
});

describe("PLANNER_PAN", () => {
	// At 20pt iOS's full-width back swipe claimed a rightward drag on the grid
	// first and popped the screen; Tabs' pager, at 10pt, keeps it.
	test("claims a sideways drag as early as the Tabs pager, so the stack's back swipe does not win", () => {
		expect(PLANNER_PAN.activateX).toBeLessThanOrEqual(TABS_PAN.activateX);
	});

	test("gives up a vertical drag before it claims a sideways one", () => {
		expect(PLANNER_PAN.failY).toBeGreaterThan(PLANNER_PAN.activateX);
	});
});

describe("resolveSwipePage", () => {
	test("a drag past a quarter of the width pages toward it", () => {
		expect(resolveSwipePage(-100, 0, 360)).toBe(1);
		expect(resolveSwipePage(100, 0, 360)).toBe(-1);
	});

	test("a short drag stays put", () => {
		expect(resolveSwipePage(-40, 0, 360)).toBe(0);
		expect(resolveSwipePage(40, 0, 360)).toBe(0);
	});

	test("a flick pages even when it is short, unless it flicks back", () => {
		expect(resolveSwipePage(-30, -900, 360)).toBe(1);
		expect(resolveSwipePage(30, 900, 360)).toBe(-1);
		expect(resolveSwipePage(-100, 900, 360)).toBe(0);
	});

	test("no width means no paging", () => {
		expect(resolveSwipePage(-200, -2000, 0)).toBe(0);
	});
});

describe("plannerVariants", () => {
	const light = declaredTokens("light");
	const dark = declaredTokens("dark");

	function everyCombination(): ReturnType<typeof plannerVariants>[] {
		return PLANNER_VARIANTS.flatMap((variant) =>
			[true, false].flatMap((isToday) =>
				[true, false].flatMap((isSelected) =>
					[true, false].flatMap((isInMonth) =>
						[true, false].map((fill) => plannerVariants({ fill, isInMonth, isSelected, isToday, variant }))
					)
				)
			)
		);
	}

	const VIEW_SLOTS = [
		"root",
		"header",
		"nav",
		"weekdays",
		"grid",
		"week",
		"cell",
		"day",
		"marker",
		"markerFill",
		"dots",
		"dot",
		"icons",
		"tile",
		"blocks",
		"block",
		"legend",
		"legendItem",
		"legendDot",
		"footer",
	] as const;

	test("no view slot carries a text colour or size (rule 1)", () => {
		for (const slots of everyCombination()) {
			for (const slot of VIEW_SLOTS) {
				expect(slots[slot]() ?? "").not.toMatch(/(?:^|\s)text-/);
			}
		}
	});

	test("every colour token named by a slot exists in both themes", () => {
		const used = new Set<string>();
		for (const colorIndex of PLANNER_COLOR_INDEXES) {
			for (const slots of [...everyCombination(), plannerVariants({ colorIndex: `${colorIndex}` })]) {
				for (const fn of Object.values(slots)) {
					for (const match of (fn() ?? "").matchAll(
						/(?:^|\s)(?:bg|text|border)-([a-z][a-z0-9-]*?)(?:\/\d+)?(?=\s|$)/g
					)) {
						const token = match[1];
						if (token && !/^(?:\d|xs|sm|md|lg|xl|\dxl|transparent|center|left|right|button-|icon-)/.test(token)) {
							used.add(token);
						}
					}
				}
			}
		}
		expect(used.size).toBeGreaterThan(0);
		for (const token of used) {
			expect({ token, light: light.has(token), dark: dark.has(token) }).toEqual({ token, light: true, dark: true });
		}
	});

	test("today rings and selection fills, and both can apply to one day", () => {
		const both = plannerVariants({ isSelected: true, isToday: true, variant: "default" });
		expect(both.marker()).toContain("border-primary");
		expect(both.markerFill()).toContain("bg-primary");
		expect(both.numeral()).toContain("text-primary-foreground");

		const today = plannerVariants({ isSelected: false, isToday: true, variant: "default" });
		expect(today.marker()).toContain("border-primary");
		expect(today.markerFill()).not.toContain("bg-primary");

		const selected = plannerVariants({ isSelected: true, isToday: false, variant: "default" });
		expect(selected.marker()).not.toContain("border-primary");
		expect(selected.markerFill()).toContain("bg-primary");
	});

	test("a day outside the month is muted", () => {
		expect(plannerVariants({ isInMonth: false }).numeral()).toContain("text-muted-foreground");
		expect(plannerVariants({ isInMonth: true }).numeral()).toContain("text-foreground");
	});

	test("fill makes the grid and every week share the height", () => {
		const filled = plannerVariants({ fill: true, variant: "calendar" });
		expect(filled.root()).toContain("flex-1");
		expect(filled.grid()).toContain("flex-1");
		expect(filled.week()).toContain("flex-1");
		expect(plannerVariants({ fill: false, variant: "default" }).week()).not.toContain("flex-1");
	});

	test("a week's height is fixed per variant, so paging never moves the layout", () => {
		for (const variant of PLANNER_VARIANTS) {
			const cell = plannerVariants({ fill: false, variant }).cell();
			expect(cell).toMatch(/(?:^|\s)(?:h-\d+|aspect-square|min-h-\d+)(?:\s|$)/);
		}
	});

	test("a chart tint class exists for every colour slot", () => {
		for (const colorIndex of PLANNER_COLOR_INDEXES) {
			expect(plannerVariants({ colorIndex: `${colorIndex}` }).swatch()).toContain(`bg-chart-${colorIndex}`);
			expect(plannerVariants({ colorIndex: `${colorIndex}` }).tint()).toContain(`bg-chart-${colorIndex}/15`);
		}
	});
});
