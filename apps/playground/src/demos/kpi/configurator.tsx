import { Icon } from "@delacour/react-native-ui/icon";
import { IconPeople } from "@delacour/react-native-ui/icons/central";
import {
	KPI_COLOR_INDEXES,
	KPI_GOOD_DIRECTIONS,
	KPI_LAYOUTS,
	KPI_SIZES,
	KPI_TREND_VARIANTS,
	Kpi,
	type KpiColorIndex,
	type KpiGoodDirection,
	type KpiLayout,
	type KpiSize,
	type KpiTrendVariant,
} from "@delacour/react-native-ui/kpi";
import { Radio } from "@delacour/react-native-ui/radio";
import { SURFACE_VARIANTS, type SurfaceVariant } from "@delacour/react-native-ui/surface";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Configurator",
	caption:
		"Every fill, size, layout, trend variant, good direction and series colour, one pick at a time — and loading on and off.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const VARIANT_LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

const SIZE_LABELS: Record<KpiSize, string> = { sm: "Small", md: "Medium", lg: "Large" };
const LAYOUT_LABELS: Record<KpiLayout, string> = { below: "Below", inline: "Inline" };
const TREND_LABELS: Record<KpiTrendVariant, string> = { text: "Text", badge: "Badge" };
const DIRECTION_LABELS: Record<KpiGoodDirection, string> = { up: "Up", down: "Down", none: "None" };

const ACTIVE_USERS = [3.1, 3.4, 3.2, 3.8, 4.1, 3.9, 4.4, 4.6, 4.5, 4.9];

/** One labelled radio row, typed on the option's own union so a new value cannot be forgotten. */
function Picker<T extends string | number>({
	label,
	options,
	labels,
	value,
	onChange,
	id,
}: {
	label: string;
	options: readonly T[];
	labels: (option: T) => string;
	value: T;
	onChange: (value: T) => void;
	id: string;
}): ReactElement {
	return (
		<View className="gap-2">
			<Text.Overline>{label}</Text.Overline>
			<Radio.Group
				accessibilityLabel={label}
				onSelected={(next) => {
					const match = options.find((option) => String(option) === next);
					if (match !== undefined) onChange(match);
				}}
				orientation="horizontal"
				selected={String(value)}
			>
				{options.map((option) => (
					<Radio key={String(option)} testID={`kpi-configurator-${id}-${option}`} value={String(option)}>
						{labels(option)}
					</Radio>
				))}
			</Radio.Group>
		</View>
	);
}

export function Demo(): ReactElement {
	const [variant, setVariant] = useState<SurfaceVariant>("default");
	const [size, setSize] = useState<KpiSize>("md");
	const [layout, setLayout] = useState<KpiLayout>("below");
	const [trend, setTrend] = useState<KpiTrendVariant>("text");
	const [goodDirection, setGoodDirection] = useState<KpiGoodDirection>("up");
	const [colorIndex, setColorIndex] = useState<KpiColorIndex>(1);
	const [isLoading, setLoading] = useState(false);

	return (
		<View className="gap-5">
			<Kpi
				colorIndex={colorIndex}
				goodDirection={goodDirection}
				isLoading={isLoading}
				size={size}
				testID="kpi-configurator"
				variant={variant}
			>
				<Kpi.Header>
					<Kpi.Icon>
						<Icon icon={IconPeople} />
					</Kpi.Icon>
					<Kpi.Title>Active users</Kpi.Title>
				</Kpi.Header>
				<Kpi.Content layout={layout}>
					<Kpi.Stat>
						<Kpi.Value>4,912</Kpi.Value>
						<Kpi.Trend caption="vs last week" value={8.9} variant={trend} />
					</Kpi.Stat>
					<Kpi.Sparkline data={ACTIVE_USERS} />
				</Kpi.Content>
			</Kpi>
			<Picker
				id="variant"
				label="Variant"
				labels={(v) => VARIANT_LABELS[v]}
				onChange={setVariant}
				options={SURFACE_VARIANTS}
				value={variant}
			/>
			<Picker
				id="size"
				label="Size"
				labels={(v) => SIZE_LABELS[v]}
				onChange={setSize}
				options={KPI_SIZES}
				value={size}
			/>
			<Picker
				id="layout"
				label="Layout"
				labels={(v) => LAYOUT_LABELS[v]}
				onChange={setLayout}
				options={KPI_LAYOUTS}
				value={layout}
			/>
			<Picker
				id="trend"
				label="Trend"
				labels={(v) => TREND_LABELS[v]}
				onChange={setTrend}
				options={KPI_TREND_VARIANTS}
				value={trend}
			/>
			<Picker
				id="direction"
				label="Good direction"
				labels={(v) => DIRECTION_LABELS[v]}
				onChange={setGoodDirection}
				options={KPI_GOOD_DIRECTIONS}
				value={goodDirection}
			/>
			<Picker
				id="colour"
				label="Colour"
				labels={(v) => String(v)}
				onChange={setColorIndex}
				options={KPI_COLOR_INDEXES}
				value={colorIndex}
			/>
			<View className="flex-row items-center justify-between gap-3">
				<Text.Label>Loading</Text.Label>
				<Switch
					accessibilityLabel="Loading"
					isSelected={isLoading}
					onSelectedChange={setLoading}
					size="sm"
					testID="kpi-configurator-loading"
				/>
			</View>
		</View>
	);
}
