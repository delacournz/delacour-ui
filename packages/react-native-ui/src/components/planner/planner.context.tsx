import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { PlannerCategory, PlannerEntry } from "./planner.types";
import type { PlannerVariant } from "./planner.variants";
import type { PlannerWeekStart } from "./planner-dates";

/** What moved the month: a `Nav` button, a swipe on the grid, the `Today` control, or the scroller. */
export type PlannerNavigationOrigin = "nav" | "swipe" | "today" | "scroll";

/**
 * A month change the planner asked for and has not yet seen land.
 *
 * Kept so the grid knows which way to slide and the root knows whether to
 * announce it — and so neither does anything for a change a controlled parent
 * refused, because a refused month never arrives to match the key.
 */
export type PlannerPendingPage = { key: string; direction: -1 | 0 | 1; origin: PlannerNavigationOrigin };

export type PlannerContextValue = {
	/** The 1st of the displayed month. */
	month: Date;
	/** Shows a month, with no slide and no announcement. */
	setMonth: (month: Date) => void;
	/** Shows a month the way a person asked for it: slid in, and announced unless it came from scrolling. */
	navigate: (month: Date, origin: PlannerNavigationOrigin) => void;
	/** One month back (`-1`) or on (`1`). */
	page: (direction: -1 | 1, origin?: PlannerNavigationOrigin) => void;
	/** Back to the month holding today. */
	goToToday: () => void;
	/** The selected day, or `null`. */
	selected: Date | null;
	/** Selects a day, or clears the selection with `null`. */
	select: (date: Date | null) => void;
	/** What a day's button does: `onDayPress`, then select it — or clear it when it already is. */
	pressDay: (date: Date) => void;
	entries: readonly PlannerEntry[];
	categories: readonly PlannerCategory[];
	/** The entries keyed by `YYYY-MM-DD`. */
	entriesByDay: ReadonlyMap<string, readonly PlannerEntry[]>;
	/** Local midnight today. Moves at midnight and when the app returns to the foreground. */
	today: Date;
	todayKey: string;
	variant: PlannerVariant;
	fill: boolean;
	/** The resolved limit — the caller's, or the variant's default. */
	entryLimit: number;
	/** The resolved week start — `auto` already read from the locale. */
	weekStartsOn: PlannerWeekStart;
	locale: string | undefined;
	showOutsideDays: boolean;
	isFramed: boolean;
	/** Internal: the month change in flight. See {@link PlannerPendingPage}. */
	pendingRef: RefObject<PlannerPendingPage | null>;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

/**
 * Supplies the enclosing planner's month, selection and entries to its subtree.
 *
 * Lives in its own module, importing nothing but types, so a part the planner
 * renders can read it without importing `./planner` and closing a cycle. See
 * AGENTS.md rule 3.
 */
export function PlannerProvider({
	value,
	children,
}: {
	value: PlannerContextValue;
	children: ReactNode;
}): ReactElement {
	return <PlannerContext value={value}>{children}</PlannerContext>;
}
PlannerProvider.displayName = "DelacourUI.Planner.Provider";

/** The enclosing planner's context, or null outside a `<Planner>`. */
export function usePlannerContext(): PlannerContextValue | null {
	return use(PlannerContext);
}

/**
 * Reads the enclosing planner — the month and how to move it, the selection,
 * today, and the entries by day.
 *
 * What a custom header, day or details screen uses to stay in step with the
 * planner. Throws outside a `<Planner>`; use {@link usePlannerContext} where
 * the planner is optional.
 */
export function usePlanner(): PlannerContextValue {
	const context = usePlannerContext();
	if (!context) {
		throw new Error("usePlanner must be called inside a <Planner>.");
	}
	return context;
}

/**
 * The enclosing planner's context, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link usePlanner}, whose error names the hook rather than a part.
 */
export function usePlannerPart(component: string): PlannerContextValue {
	const context = usePlannerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Planner>.`);
	}
	return context;
}
