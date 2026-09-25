import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { BadgeColor } from "../badge/badge.variants";
import { CARD_SIZES } from "../card/card.variants";
import type { ChartDatum } from "../chart/chart.types";

/** The card's own three sizes — a KPI is a card, so it has no scale of its own. */
export const KPI_SIZES = CARD_SIZES;

/**
 * Which way is the good news. `up` for revenue and sign-ups, `down` for churn
 * and latency, `none` for a number that is neither — a headcount, a version.
 */
export const KPI_GOOD_DIRECTIONS = ["up", "down", "none"] as const;

/** Which way the number moved. `flat` is a movement inside the threshold. */
export const KPI_DIRECTIONS = ["up", "down", "flat"] as const;

/** What the movement means — the colour it is painted, whatever its sign. */
export const KPI_TONES = ["good", "bad", "neutral"] as const;

/** `text` is a line of colour under the number; `badge` puts a pill round it, with an arrow. */
export const KPI_TREND_VARIANTS = ["text", "badge"] as const;

/** `below` puts the sparkline under everything; `inline` sets it in a column beside the number. */
export const KPI_LAYOUTS = ["below", "inline"] as const;

/** The five slots of the theme's series ramp, `--chart-1` … `--chart-5`. */
export const KPI_COLOR_INDEXES = [1, 2, 3, 4, 5] as const;

/** `horizontal` splits a row between the metrics; `vertical` stacks them. */
export const KPI_GROUP_ORIENTATIONS = ["horizontal", "vertical"] as const;

export type KpiSize = (typeof KPI_SIZES)[number];
export type KpiGoodDirection = (typeof KPI_GOOD_DIRECTIONS)[number];
export type KpiDirection = (typeof KPI_DIRECTIONS)[number];
export type KpiTone = (typeof KPI_TONES)[number];
export type KpiTrendVariant = (typeof KPI_TREND_VARIANTS)[number];
export type KpiLayout = (typeof KPI_LAYOUTS)[number];
export type KpiColorIndex = (typeof KPI_COLOR_INDEXES)[number];
export type KpiGroupOrientation = (typeof KPI_GROUP_ORIENTATIONS)[number];

/** A badge trend's colour, by what the movement means. */
export const KPI_TONE_BADGE_COLOR: Record<KpiTone, BadgeColor> = {
	good: "success",
	bad: "destructive",
	neutral: "default",
};

/**
 * Styling for every part of a KPI.
 *
 * The card itself — fill, hairline, corner, the vertical rhythm and the inset
 * — is `Card`'s. The header and content slots here carry **no inset**: the
 * parts compose them onto `cardVariants`' own `header` and `content`, so a
 * KPI's number sits on exactly the line its card's footer does and a retune of
 * the card moves both.
 *
 * The value is keyed on `plane` the same way `Card.Title` is, so a KPI nested
 * in a secondary surface reads `secondary-foreground` rather than the card's
 * token on something else. The title is `muted-foreground` everywhere: it is
 * a label, and the value is the thing being read.
 *
 * The title never grows. A growing child of a column absorbs that column's
 * spare height, which in a row of cards lands each number at a different
 * height; the header pushes its action to the end with `ml-auto` instead.
 *
 * The trend is coloured by `tone` — what the movement means — and never by its
 * sign: a fall in churn is good news, drawn as good news. The two colours are
 * the `-soft-foreground` state tokens, which are built to be read as text on a
 * card in both themes.
 *
 * The icon square is the series colour at 15%, one token per slot written out,
 * because Tailwind's scanner cannot see a `bg-chart-${n}` built at runtime.
 *
 * View slots carry no `text-*` (rule 1). Free of React Native imports so it
 * stays unit-testable.
 */
export const kpiVariants = tv({
	slots: {
		header: "flex-row items-center gap-2",
		icon: "shrink-0 items-center justify-center rounded-md",
		/** Not a view — the class an unstyled `Icon` inside `Kpi.Icon` adopts. */
		iconGlyph: "",
		title: "font-medium text-muted-foreground",
		action: "ml-auto shrink-0 flex-row items-center gap-2",
		content: "self-stretch",
		stat: "gap-1",
		value: "font-semibold",
		valuePlaceholder: "rounded-md bg-muted-foreground/15",
		trend: "flex-row flex-wrap items-center gap-x-1.5 gap-y-1",
		trendText: "font-medium",
		trendCaption: "text-muted-foreground",
		trendPlaceholder: "rounded-sm bg-muted-foreground/15",
		sparkline: "",
		sparklineFrame: "",
		sparklinePlaceholder: "w-full rounded-md bg-muted-foreground/15",
		group: "gap-3",
		groupItem: "",
	},
	variants: {
		size: {
			sm: {
				icon: "size-6",
				iconGlyph: "size-icon-xs",
				title: "text-xs",
				value: "text-2xl",
				valuePlaceholder: "h-8 w-24",
				trendText: "text-xs",
				trendCaption: "text-xs",
				trendPlaceholder: "h-4 w-20",
			},
			md: {
				icon: "size-8",
				iconGlyph: "size-icon-sm",
				title: "text-sm",
				value: "text-3xl",
				valuePlaceholder: "h-9 w-28",
				trendText: "text-sm",
				trendCaption: "text-sm",
				trendPlaceholder: "h-5 w-24",
			},
			lg: {
				icon: "size-10",
				iconGlyph: "size-icon-lg",
				title: "text-base",
				value: "text-4xl",
				valuePlaceholder: "h-10 w-36",
				trendText: "text-base",
				trendCaption: "text-base",
				trendPlaceholder: "h-6 w-28",
			},
		},
		plane: {
			default: { value: "text-card-foreground" },
			secondary: { value: "text-secondary-foreground" },
			tertiary: { value: "text-tertiary-foreground" },
			none: { value: "text-foreground" },
		},
		tone: {
			good: { trendText: "text-success-soft-foreground" },
			bad: { trendText: "text-destructive-soft-foreground" },
			neutral: { trendText: "text-muted-foreground" },
		},
		colorIndex: {
			1: { icon: "bg-chart-1/15" },
			2: { icon: "bg-chart-2/15" },
			3: { icon: "bg-chart-3/15" },
			4: { icon: "bg-chart-4/15" },
			5: { icon: "bg-chart-5/15" },
		},
		layout: {
			below: { sparkline: "w-full" },
			inline: {
				content: "flex-row items-end gap-4",
				stat: "min-w-0 flex-1",
				sparkline: "w-32 shrink-0",
			},
		},
		orientation: {
			horizontal: { group: "flex-row", groupItem: "min-w-0 flex-1" },
			vertical: {},
		},
		// A separated group is one surface with rules between its metrics; the
		// rule is the spacing, so there is no gap to add to it.
		separated: {
			true: { group: "gap-0" },
			false: {},
		},
	},
	compoundVariants: [
		{ layout: "below", size: "sm", class: { sparklineFrame: "h-12", sparklinePlaceholder: "h-12" } },
		{ layout: "below", size: "md", class: { sparklineFrame: "h-16", sparklinePlaceholder: "h-16" } },
		{ layout: "below", size: "lg", class: { sparklineFrame: "h-20", sparklinePlaceholder: "h-20" } },
		{ layout: "inline", size: "sm", class: { sparklineFrame: "h-8", sparklinePlaceholder: "h-8" } },
		{ layout: "inline", size: "md", class: { sparklineFrame: "h-10", sparklinePlaceholder: "h-10" } },
		{ layout: "inline", size: "lg", class: { sparklineFrame: "h-12", sparklinePlaceholder: "h-12" } },
	],
	defaultVariants: {
		size: "md",
		plane: "default",
		tone: "neutral",
		colorIndex: 1,
		layout: "below",
		orientation: "vertical",
		separated: false,
	},
});

export type KpiVariantProps = VariantProps<typeof kpiVariants>;

/**
 * Which way a number moved and what that means.
 *
 * The sign carries the direction, so there is no separate direction prop to
 * keep in step with the value. A movement no larger than `threshold` counts as
 * none, and a value that is not finite — a change against a zero baseline —
 * is flat rather than painted as news of either kind.
 */
export function resolveKpiTrend({
	value,
	goodDirection = "up",
	threshold = 0,
}: {
	value: number;
	goodDirection?: KpiGoodDirection;
	threshold?: number;
}): { direction: KpiDirection; tone: KpiTone } {
	const floor = Math.max(0, threshold);
	if (!Number.isFinite(value) || Math.abs(value) <= floor) {
		return { direction: "flat", tone: "neutral" };
	}
	const direction = value > 0 ? "up" : "down";
	if (goodDirection === "none") return { direction, tone: "neutral" };
	return { direction, tone: direction === goodDirection ? "good" : "bad" };
}

/** U+2212, the width of a plus sign. A hyphen-minus is narrower and misaligns a column. */
const MINUS = "−";

/**
 * A signed percentage to one decimal place: `+7.8%`, `−4.2%`, `0.0%`.
 *
 * Signed explicitly both ways, with the typographic minus. A value that rounds
 * to zero is printed unsigned — `−0.0%` would claim a fall nothing shows. A
 * value that is not finite prints as an em dash.
 */
export function formatKpiTrend(value: number): string {
	if (!Number.isFinite(value)) return "—";
	const magnitude = Math.abs(value).toFixed(1);
	if (Number(magnitude) === 0) return `${magnitude}%`;
	return `${value > 0 ? "+" : MINUS}${magnitude}%`;
}

const DIRECTION_WORD: Record<KpiDirection, string> = { up: "Up", down: "Down", flat: "No change" };

/**
 * What a screen reader says for a trend, as one string.
 *
 * "Up 7.8 percent, vs last month" rather than an arrow, a number and a caption
 * read as three unrelated stops. A caller's own `formatted` text may not be a
 * percentage at all, so it is read as written after the direction.
 */
export function kpiTrendAccessibilityLabel({
	value,
	direction,
	caption,
	formatted,
}: {
	value: number;
	direction: KpiDirection;
	caption?: string;
	formatted?: string;
}): string {
	const head =
		direction === "flat"
			? DIRECTION_WORD.flat
			: formatted === undefined
				? `${DIRECTION_WORD[direction]} ${Math.abs(value).toFixed(1)} percent`
				: `${DIRECTION_WORD[direction]}, ${formatted}`;
	return caption === undefined || caption === "" ? head : `${head}, ${caption}`;
}

/**
 * A sparkline's data: a bare list of numbers, or rows with the keys to read.
 *
 * The two are told apart by `xKey`, which rows need and numbers do not have.
 */
export type KpiSparklineData =
	| { readonly data: readonly number[]; readonly xKey?: undefined; readonly yKey?: undefined }
	| { readonly data: readonly ChartDatum[]; readonly xKey: string; readonly yKey: string };

/** What the sparkline hands `Chart`, plus the plain values for everything else to read. */
export type KpiSparklineSeries = {
	readonly rows: readonly ChartDatum[];
	readonly xKey: string;
	readonly yKey: string;
	/** One per row, `NaN` where a row has no number. */
	readonly values: readonly number[];
};

function numberOf(value: unknown): number {
	return typeof value === "number" ? value : Number.NaN;
}

/**
 * Turns either data shape into rows `Chart` can plot.
 *
 * A bare list of numbers is indexed — `{ index, value }` per point — because a
 * sparkline's x is only ever its order. Rows pass through untouched, keyed by
 * the caller.
 */
export function resolveSparklineSeries(input: KpiSparklineData): KpiSparklineSeries {
	if (input.xKey === undefined) {
		const rows = input.data.map((value, index) => ({ index, value }));
		return { rows, xKey: "index", yKey: "value", values: input.data };
	}
	const { data, xKey, yKey } = input;
	return { rows: data, xKey, yKey, values: data.map((row) => numberOf(row[yKey])) };
}

/** The fraction of the data's span added above its peak and below its trough. */
const SPARKLINE_HEADROOM = 0.1;

/**
 * The y bounds a sparkline plots against: the data's own extent, padded.
 *
 * A sparkline has no axis and no padding, so a line drawn to the data's exact
 * extent puts its peak and its trough on the frame's edge with half the stroke
 * off the canvas. A tenth of the span each side keeps both inside. A flat
 * series has no span, so it gets a unit either side and sits centred.
 */
export function resolveSparklineDomain(values: readonly number[]): readonly [number, number] | undefined {
	const finite = values.filter(Number.isFinite);
	if (finite.length === 0) return undefined;
	const min = Math.min(...finite);
	const max = Math.max(...finite);
	const pad = max === min ? 1 : (max - min) * SPARKLINE_HEADROOM;
	return [min - pad, max + pad];
}

/**
 * Whether the region under the line is filled.
 *
 * On under the card, where the chart has the full width and is looked at
 * properly; off beside the number, where the chart is a gesture and a fill
 * would make it a second block competing with the value. An explicit choice
 * wins either way.
 */
export function resolveSparklineFilled({ layout, filled }: { layout: KpiLayout; filled?: boolean }): boolean {
	return filled ?? layout === "below";
}

/**
 * What a screen reader says for a sparkline: how many points, and where it
 * started and ended — the two numbers a glance at the shape is reading.
 */
export function kpiSparklineAccessibilityLabel(
	values: readonly number[],
	format: (value: number) => string = String
): string {
	const finite = values.filter(Number.isFinite);
	const first = finite[0];
	const last = finite[finite.length - 1];
	if (first === undefined || last === undefined) return "No trend data";
	return `Trend over ${values.length} points, from ${format(first)} to ${format(last)}`;
}
