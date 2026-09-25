import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { IconArrowDownRight, IconArrowRight, IconArrowUpRight } from "../../icons/central";
import { Badge } from "../badge";
import { Icon, type IconComponent } from "../icon";
import { Text } from "../text";
import { useKpiPart } from "./kpi.context";
import {
	formatKpiTrend,
	KPI_TONE_BADGE_COLOR,
	type KpiDirection,
	type KpiGoodDirection,
	type KpiSize,
	type KpiTrendVariant,
	kpiTrendAccessibilityLabel,
	kpiVariants,
	resolveKpiTrend,
} from "./kpi.variants";

export type KpiTrendProps = Omit<ViewProps, "children"> & {
	/**
	 * How much it moved, as a percentage. The sign carries the direction, so
	 * `-4.2` is a fall of 4.2%; there is no direction prop to keep in step.
	 */
	value: number;
	/** Writes the number yourself. Receives the raw value, sign and all. */
	format?: (value: number) => string;
	/** Overrides the KPI's own `goodDirection` for this one figure. */
	goodDirection?: KpiGoodDirection;
	/**
	 * `text` is a line of colour under the number — what a stat card usually
	 * wants. `badge` puts a pill round it with an arrow, for a card busy enough
	 * that a bare line of colour is lost in it.
	 */
	variant?: KpiTrendVariant;
	/** What it is compared against — "vs last month", "last 30d". Read after the change. */
	caption?: string;
	/** A movement no larger than this counts as none. Defaults to `0`. */
	threshold?: number;
	className?: string;
	/** Anything after the caption, when a string is not enough. */
	children?: ReactNode;
};

const ARROW: Record<KpiDirection, IconComponent> = {
	up: IconArrowUpRight,
	down: IconArrowDownRight,
	flat: IconArrowRight,
};

const BADGE_SIZE: Record<KpiSize, "sm" | "md"> = { sm: "sm", md: "sm", lg: "md" };

/**
 * The change: a signed percentage, coloured by what it means.
 *
 * It derives its own direction from the sign and its own tone from the KPI's
 * `goodDirection`, so a fall in churn is drawn as good news without the call
 * site naming a colour. The arrow on a badge says the direction again in a
 * shape, so the meaning never rests on colour alone.
 *
 * Announced as one string — "Up 7.8 percent, vs last month" — rather than a
 * number, an arrow and a caption read as three stops. While the KPI loads it
 * is a short muted bar.
 */
export function KpiTrend({
	value,
	format,
	goodDirection: goodDirectionProp,
	variant = "text",
	caption,
	threshold,
	className,
	children,
	...props
}: KpiTrendProps): ReactElement {
	const context = useKpiPart("Kpi.Trend");
	const { size, isLoading } = context;
	const goodDirection = goodDirectionProp ?? context.goodDirection;
	const { direction, tone } = resolveKpiTrend({ goodDirection, threshold, value });
	const slots = kpiVariants({ size, tone });

	if (isLoading) {
		return <View className={slots.trendPlaceholder()} />;
	}

	const formatted = format?.(value);
	const text = formatted ?? formatKpiTrend(value);
	const accessibilityLabel = kpiTrendAccessibilityLabel({ caption, direction, formatted, value });

	return (
		<View accessibilityLabel={accessibilityLabel} accessible className={slots.trend({ className })} {...props}>
			{variant === "badge" ? (
				<Badge color={KPI_TONE_BADGE_COLOR[tone]} size={BADGE_SIZE[size]} variant="soft">
					<Icon icon={ARROW[direction]} />
					<Badge.Label>{text}</Badge.Label>
				</Badge>
			) : (
				<Text className={slots.trendText()}>{text}</Text>
			)}
			{caption === undefined ? null : <Text className={slots.trendCaption()}>{caption}</Text>}
			{children}
		</View>
	);
}
KpiTrend.displayName = "DelacourUI.Kpi.Trend";
