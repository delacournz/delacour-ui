import { Button } from "@delacour/react-native-ui/button";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import { IconBasket1, IconDollar, IconReceiptStorno } from "@delacour/react-native-ui/icons/central";
import { Kpi, type KpiColorIndex, type KpiGoodDirection, useKpi } from "@delacour/react-native-ui/kpi";
import { Pressable } from "@delacour/react-native-ui/pressable";
import { type ReactElement, useMemo, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dashboard",
	caption:
		"Three metrics as a picker, each a `Pressable` around a small inline card, and the chosen one drawn large below — hold its sparkline to read any day. The period switches every series at once.",
	capture: { align: "stretch" },
};

type Period = "7d" | "30d" | "90d";
type MetricId = "revenue" | "orders" | "refunds";

type Metric = {
	id: MetricId;
	title: string;
	icon: IconComponent;
	colorIndex: KpiColorIndex;
	goodDirection: KpiGoodDirection;
	base: number;
	drift: number;
	format: (value: number) => string;
};

const PERIODS: readonly { id: Period; label: string; days: number }[] = [
	{ id: "7d", label: "7 days", days: 7 },
	{ id: "30d", label: "30 days", days: 30 },
	{ id: "90d", label: "90 days", days: 90 },
];

const METRICS: readonly Metric[] = [
	{
		id: "revenue",
		title: "Revenue",
		icon: IconDollar,
		colorIndex: 1,
		goodDirection: "up",
		base: 1600,
		drift: 6,
		format: (value) => `$${Math.round(value).toLocaleString("en-NZ")}`,
	},
	{
		id: "orders",
		title: "Orders",
		icon: IconBasket1,
		colorIndex: 2,
		goodDirection: "up",
		base: 42,
		drift: -0.08,
		format: (value) => Math.round(value).toLocaleString("en-NZ"),
	},
	{
		id: "refunds",
		title: "Refunds",
		icon: IconReceiptStorno,
		colorIndex: 3,
		goodDirection: "down",
		base: 3.2,
		drift: -0.012,
		format: (value) => `${value.toFixed(1)}%`,
	},
];

/** A deterministic daily series — a drift with a weekly swing — so every render draws the same shape. */
function series(metric: Metric, days: number): number[] {
	return Array.from({ length: days }, (_, day) => {
		const swing = Math.sin(day * 0.45) * metric.base * 0.025;
		return Math.max(0, metric.base + metric.drift * day + swing);
	});
}

function change(values: readonly number[]): number {
	const first = values[0] ?? 0;
	const last = values[values.length - 1] ?? 0;
	return first === 0 ? 0 : ((last - first) / first) * 100;
}

/** The big card's number: the scrubbed day while a finger is on the line, the latest day otherwise. */
function ScrubbedValue({ metric, values }: { metric: Metric; values: readonly number[] }): ReactElement {
	const { activeIndex } = useKpi();
	const index = activeIndex ?? values.length - 1;
	const daysAgo = values.length - 1 - index;
	return (
		<Kpi.Stat>
			<Kpi.Value testID="kpi-dashboard-value">{metric.format(values[index] ?? 0)}</Kpi.Value>
			<Kpi.Trend
				caption={daysAgo === 0 ? "today, over the period" : `${daysAgo} days ago`}
				value={change(values.slice(0, index + 1))}
			/>
		</Kpi.Stat>
	);
}

/** One metric in the picker — the press, the role and the checked state live here, not on the card. */
function MetricOption({
	metric,
	values,
	isSelected,
	onSelect,
}: {
	metric: Metric;
	values: readonly number[];
	isSelected: boolean;
	onSelect: (id: MetricId) => void;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={metric.title}
			accessibilityRole="radio"
			accessibilityState={{ checked: isSelected }}
			feedback="scale"
			haptic="selection"
			onPress={() => onSelect(metric.id)}
			testID={`kpi-dashboard-${metric.id}`}
		>
			<Kpi
				className={isSelected ? "border-primary" : undefined}
				colorIndex={metric.colorIndex}
				goodDirection={metric.goodDirection}
				size="sm"
			>
				<Kpi.Content layout="inline">
					<Kpi.Stat>
						<Kpi.Title>{metric.title}</Kpi.Title>
						<Kpi.Value>{metric.format(values[values.length - 1] ?? 0)}</Kpi.Value>
						<Kpi.Trend value={change(values)} />
					</Kpi.Stat>
					<Kpi.Sparkline data={values} formatValue={metric.format} interactive={false} />
				</Kpi.Content>
			</Kpi>
		</Pressable>
	);
}

export function Demo(): ReactElement {
	const [period, setPeriod] = useState<Period>("30d");
	const [selected, setSelected] = useState<MetricId>("revenue");
	const days = PERIODS.find((entry) => entry.id === period)?.days ?? 30;
	const data = useMemo(() => new Map(METRICS.map((metric) => [metric.id, series(metric, days)])), [days]);
	const metric = METRICS.find((entry) => entry.id === selected) ?? METRICS[0];
	const values = data.get(metric.id) ?? [];

	return (
		<View className="gap-4">
			<View accessibilityLabel="Period" accessibilityRole="radiogroup" className="flex-row gap-2">
				{PERIODS.map((entry) => (
					<Button
						accessibilityRole="radio"
						accessibilityState={{ checked: entry.id === period }}
						key={entry.id}
						onPress={() => setPeriod(entry.id)}
						size="sm"
						testID={`kpi-dashboard-period-${entry.id}`}
						variant={entry.id === period ? "secondary" : "ghost"}
					>
						{entry.label}
					</Button>
				))}
			</View>
			<View accessibilityLabel="Metric" accessibilityRole="radiogroup" className="gap-2">
				{METRICS.map((entry) => (
					<MetricOption
						isSelected={entry.id === selected}
						key={entry.id}
						metric={entry}
						onSelect={setSelected}
						values={data.get(entry.id) ?? []}
					/>
				))}
			</View>
			<Kpi
				colorIndex={metric.colorIndex}
				goodDirection={metric.goodDirection}
				key={metric.id}
				testID="kpi-dashboard-detail"
			>
				<Kpi.Header>
					<Kpi.Icon>
						<Icon icon={metric.icon} />
					</Kpi.Icon>
					<Kpi.Title>{metric.title}</Kpi.Title>
				</Kpi.Header>
				<Kpi.Content>
					<ScrubbedValue metric={metric} values={values} />
					<Kpi.Sparkline data={values} formatValue={metric.format} testID="kpi-dashboard-chart" />
				</Kpi.Content>
				<Kpi.Footer variant="band">Compared with the start of the last {days} days</Kpi.Footer>
			</Kpi>
		</View>
	);
}
