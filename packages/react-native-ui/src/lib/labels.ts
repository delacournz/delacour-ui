/**
 * Every string the library speaks or shows on its own, keyed by component, with English defaults.
 *
 * One catalog, and it imports nothing. A component's label type cannot live in its own folder and
 * still be named here: the registry follows type-only imports, so a typed map importing
 * `TourLabels` from `tour/` would drag every component into every copy that reads a label. A
 * catalog with no imports costs each copy one strings file instead.
 *
 * Precedence, weakest first: these defaults, then `DelacourProvider`'s `labels`, then the
 * component's own `labels` prop. An `undefined` at any layer is an absence, never a value, so a
 * spread of optional props cannot blank a string.
 *
 * A label that carries a number is a function, so a language can order and inflect it as it
 * needs — "Page 3", "3. Seite". The resolvers that compose a spoken sentence take the resolved
 * labels as an argument and stay pure.
 */

/** Breadcrumb's spoken strings. */
export type BreadcrumbLabels = {
	/** The trail's accessible name. */
	list: string;
	/**
	 * The ellipsis' accessible name. A button offers to show the levels; a static mark only says
	 * they are there. With no count it names no number.
	 */
	ellipsis: (hiddenCount: number | undefined, isInteractive: boolean) => string;
	/** The current page's spoken value, read after its title. */
	currentPage: string;
};

/** Carousel's spoken strings. */
export type CarouselLabels = {
	previous: string;
	next: string;
	/** The adjustable root's value, "2 of 5". One-based. */
	position: (current: number, count: number) => string;
};

/** Kpi's spoken strings. */
export type KpiLabels = {
	up: string;
	down: string;
	/** Read alone, in place of a direction and an amount. */
	flat: string;
	/** A trend's amount, already formatted to one decimal place: "7.8 percent". */
	percent: (magnitude: string) => string;
	/** A sparkline's name, with its first and last values already formatted. */
	sparkline: (points: number, first: string, last: string) => string;
	/** A sparkline with no finite value to read. */
	noTrendData: string;
	/** The value's placeholder while it loads. */
	loading: string;
};

/** What a looping animation's pause control is called — every looping component shares them. */
export type MotionLabels = {
	/** Offered while the loop moves. */
	pause: string;
	/** Offered while the user holds it paused. */
	resume: string;
};

/** Pagination's visible and spoken strings. */
export type PaginationLabels = {
	/** The control's accessible name. */
	list: string;
	/** Visible beside the chevron. */
	previous: string;
	/** Visible beside the chevron. */
	next: string;
	/** The previous arrow's accessible name. */
	previousPage: string;
	/** The next arrow's accessible name. */
	nextPage: string;
	/** A page item's accessible name, "Page 3". */
	page: (page: number) => string;
	/** The compact readout as a screen reader hears it, "Page 3 of 12". */
	pageOf: (page: number, count: number) => string;
	/** A gap's accessible name, "Jump forward 5 pages". */
	jump: (direction: -1 | 1, pages: number) => string;
	/** The visible status line, "41–60 of 472". */
	status: (range: { from: number; to: number; total: number }) => string;
};

/** Every component's labels, as the library ships them. */
export type DelacourLabels = {
	breadcrumb: BreadcrumbLabels;
	carousel: CarouselLabels;
	kpi: KpiLabels;
	motion: MotionLabels;
	pagination: PaginationLabels;
};

/** A component whose strings the catalog holds. */
export type DelacourLabelsComponent = keyof DelacourLabels;

/** Some of each component's labels — what `DelacourProvider`'s `labels` prop takes. */
export type DelacourLabelOverrides = { [K in DelacourLabelsComponent]?: Partial<DelacourLabels[K]> };

const plural = (count: number, one: string, other: string): string => (count === 1 ? one : other);

/** Today's English. */
export const DELACOUR_DEFAULT_LABELS: DelacourLabels = {
	breadcrumb: {
		list: "Breadcrumb",
		ellipsis: (hiddenCount, isInteractive) => {
			if (hiddenCount === undefined) return isInteractive ? "Show hidden levels" : "Hidden levels";
			const counted = `${hiddenCount} hidden ${plural(hiddenCount, "level", "levels")}`;
			return isInteractive ? `Show ${counted}` : counted;
		},
		currentPage: "current page",
	},
	carousel: {
		previous: "Previous slide",
		next: "Next slide",
		position: (current, count) => `${current} of ${count}`,
	},
	kpi: {
		up: "Up",
		down: "Down",
		flat: "No change",
		percent: (magnitude) => `${magnitude} percent`,
		sparkline: (points, first, last) => `Trend over ${points} points, from ${first} to ${last}`,
		noTrendData: "No trend data",
		loading: "Loading",
	},
	motion: {
		pause: "Pause animation",
		resume: "Resume animation",
	},
	pagination: {
		list: "Pagination",
		previous: "Previous",
		next: "Next",
		previousPage: "Previous page",
		nextPage: "Next page",
		page: (page) => `Page ${page}`,
		pageOf: (page, count) => `Page ${page} of ${count}`,
		jump: (direction, pages) =>
			`Jump ${direction === 1 ? "forward" : "back"} ${pages} ${plural(pages, "page", "pages")}`,
		status: ({ from, to, total }) => `${from}–${to} of ${total}`,
	},
};

/** `base` with every key `override` defines laid over it; an `undefined` in `override` is skipped. */
function overlay<T extends object>(base: T, override: Partial<T> | undefined): T {
	if (override === undefined) return base;
	const merged: T = { ...base };
	for (const key of Object.keys(override) as (keyof T)[]) {
		const value = override[key];
		if (value !== undefined) merged[key] = value as T[keyof T];
	}
	return merged;
}

/**
 * One component's labels: the defaults, then the provider's overrides, then the component's own.
 * Pure; the defaults are never mutated.
 */
export function resolveLabels<K extends DelacourLabelsComponent>(
	component: K,
	provider: DelacourLabelOverrides | undefined,
	own: Partial<DelacourLabels[K]> | undefined
): DelacourLabels[K] {
	const fromProvider = provider?.[component] as Partial<DelacourLabels[K]> | undefined;
	return overlay(overlay(DELACOUR_DEFAULT_LABELS[component], fromProvider), own);
}

/**
 * Whether two label overrides hold the same keys with the same values, compared with `Object.is`.
 * A function label compares by identity, so an inline arrow is a new value every time.
 */
export function areLabelsShallowEqual(a: object | undefined, b: object | undefined): boolean {
	if (a === b) return true;
	if (a === undefined || b === undefined) return false;
	const aKeys = Object.keys(a);
	if (aKeys.length !== Object.keys(b).length) return false;
	const aRecord = a as Record<string, unknown>;
	const bRecord = b as Record<string, unknown>;
	return aKeys.every((key) => Object.hasOwn(b, key) && Object.is(aRecord[key], bRecord[key]));
}

/** A nested provider's overrides over its parent's, merged per component and per key. */
export function mergeLabelOverrides(
	outer: DelacourLabelOverrides,
	inner: DelacourLabelOverrides | undefined
): DelacourLabelOverrides {
	if (inner === undefined) return outer;
	const merged: Record<string, object> = { ...outer };
	for (const component of Object.keys(inner) as DelacourLabelsComponent[]) {
		const own = inner[component];
		if (own === undefined) continue;
		merged[component] = overlay<object>(outer[component] ?? {}, own);
	}
	return merged as DelacourLabelOverrides;
}
