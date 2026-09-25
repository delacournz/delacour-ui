import { type ReactElement, useMemo } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { Card, type CardProps } from "../card";
import { type KpiContextValue, KpiProvider, useKpiGroupContext } from "./kpi.context";
import { type KpiColorIndex, type KpiGoodDirection, kpiVariants } from "./kpi.variants";
import { KpiAction } from "./kpi-action";
import { KpiContent } from "./kpi-content";
import { KpiFooter } from "./kpi-footer";
import { KpiGroup } from "./kpi-group";
import { KpiHeader } from "./kpi-header";
import { KpiIcon } from "./kpi-icon";
import { KpiSparkline } from "./kpi-sparkline";
import { KpiStat } from "./kpi-stat";
import { KpiTitle } from "./kpi-title";
import { KpiTrend } from "./kpi-trend";
import { KpiValue } from "./kpi-value";

export type KpiProps = CardProps & {
	/**
	 * Which `--chart-*` token the sparkline and the icon take. Set on the card
	 * rather than the chart, so a row of cards can be given five series colours
	 * without repeating the choice on every part. Defaults to `1`.
	 */
	colorIndex?: KpiColorIndex;
	/**
	 * Which way is the good news. `up` for revenue, `down` for churn and
	 * latency, `none` for a number that is neither. Every trend inside follows
	 * it unless it overrides it. Defaults to `up`.
	 */
	goodDirection?: KpiGoodDirection;
	/** The numbers are on their way: the value, trend and sparkline hold placeholders of their own size. */
	isLoading?: boolean;
	/** The scrubbed sparkline point, controlled. `null` when nothing is scrubbed. */
	activeIndex?: number | null;
	/** The scrubbed point to start from, uncontrolled. */
	defaultActiveIndex?: number | null;
	/** Called as the scrub moves between points, and with `null` when it lets go. */
	onActiveIndexChange?: (index: number | null) => void;
};

function KpiRoot({
	colorIndex = 1,
	goodDirection = "up",
	isLoading = false,
	activeIndex: activeIndexProp,
	defaultActiveIndex = null,
	onActiveIndexChange,
	size = "md",
	variant,
	className,
	accessibilityState,
	...props
}: KpiProps): ReactElement {
	const group = useKpiGroupContext();
	const [activeIndex, setActiveIndex] = useControllableState<number | null>({
		value: activeIndexProp,
		defaultValue: defaultActiveIndex,
		onChange: onActiveIndexChange,
	});

	const context = useMemo<KpiContextValue>(
		() => ({ activeIndex, colorIndex, goodDirection, isLoading, setActiveIndex, size }),
		[activeIndex, colorIndex, goodDirection, isLoading, setActiveIndex, size]
	);

	// Inside a separated group the group's surface is the card; each metric
	// drops its own fill and hairline unless it names one.
	const resolvedVariant = variant ?? (group?.separated ? "transparent" : undefined);
	const itemClassName = group === null ? undefined : kpiVariants({ orientation: group.orientation }).groupItem();

	return (
		<KpiProvider value={context}>
			<Card
				accessibilityState={{ ...accessibilityState, busy: isLoading }}
				className={cn(itemClassName, group?.separated ? "rounded-none border-0" : undefined, className)}
				size={size}
				variant={resolvedVariant}
				{...props}
			/>
		</KpiProvider>
	);
}

/**
 * One number, what it is doing, and the shape it made getting there.
 *
 * A `Card` with a vocabulary for a metric: a quiet title, a large value, a
 * change coloured by what it means rather than by its sign, and a sparkline in
 * the card's series colour. It takes the card's four fills and three sizes, and
 * nests and steps the same way.
 *
 * `goodDirection` is said once, on the card, and every `Kpi.Trend` inside
 * follows it — a fall in churn is drawn as good news. `colorIndex` is said once
 * too, and the icon and the sparkline share it.
 *
 * Holding the sparkline scrubs it: a dot rides the line and `activeIndex`
 * follows the finger, controlled or not. `useKpi()` reads it, so a part of
 * your own can print the scrubbed point in place of the latest one.
 *
 * @example
 * <Kpi colorIndex={2}>
 *   <Kpi.Header>
 *     <Kpi.Icon>
 *       <Icon icon={IconDollar} />
 *     </Kpi.Icon>
 *     <Kpi.Title>Revenue</Kpi.Title>
 *   </Kpi.Header>
 *   <Kpi.Content>
 *     <Kpi.Stat>
 *       <Kpi.Value>$48,120</Kpi.Value>
 *       <Kpi.Trend caption="vs last month" value={7.8} />
 *     </Kpi.Stat>
 *     <Kpi.Sparkline data={[31, 34, 33, 38, 41, 40, 48]} />
 *   </Kpi.Content>
 * </Kpi>
 *
 * @example
 * <Kpi goodDirection="down" size="sm">
 *   <Kpi.Content layout="inline">
 *     <Kpi.Stat>
 *       <Kpi.Title>Churn</Kpi.Title>
 *       <Kpi.Value>2.1%</Kpi.Value>
 *       <Kpi.Trend value={-8.4} variant="badge" />
 *     </Kpi.Stat>
 *     <Kpi.Sparkline data={churn} />
 *   </Kpi.Content>
 * </Kpi>
 */
export const Kpi = Object.assign(KpiRoot, {
	/** The top row — a tinted icon, the metric's name, and an action pushed to the end. */
	Header: KpiHeader,
	/** A square tinted in the series colour; an unstyled `Icon` inside takes that colour. */
	Icon: KpiIcon,
	/** The metric's name, quiet, on one line. */
	Title: KpiTitle,
	/** The header's trailing end — a menu, a filter, a link. */
	Action: KpiAction,
	/** The body. `layout="inline"` sets the sparkline beside the number instead of under it. */
	Content: KpiContent,
	/** The value and its change, stacked tight as one fact. */
	Stat: KpiStat,
	/** The number, formatted by you, on the card's foreground token. */
	Value: KpiValue,
	/** The change as a signed percentage, coloured by what it means. */
	Trend: KpiTrend,
	/** A line of the series, with no axes, in the card's series colour. Hold to scrub. */
	Sparkline: KpiSparkline,
	/** The last row — a comparison period or a caveat, or `variant="band"` for a strip. */
	Footer: KpiFooter,
	/** Several metrics in a row or a column, optionally on one surface with rules between. */
	Group: KpiGroup,
	displayName: "DelacourUI.Kpi",
});
