import {
	CartesianChart,
	ChartArea,
	ChartGrid,
	ChartLine,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "@delacour/react-native-charts";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A change of data",
	caption:
		"Swap the rows and every mark morphs from the path it drew to the path it will draw. Nothing on the call site asks for it: `animation` defaults to a 300 ms timing, and this chart only slows it down.",
	capture: { align: "stretch", flow: "charts/animation/morph" },
};

type Week = "this" | "last";

const WEEKS = ["this", "last"] as const satisfies readonly Week[];

const LABELS: Record<Week, string> = {
	this: "This week",
	last: "Last week",
};

const DATA: Record<Week, { day: string; revenue: number }[]> = {
	this: [
		{ day: "Mon", revenue: 42 },
		{ day: "Tue", revenue: 58 },
		{ day: "Wed", revenue: 51 },
		{ day: "Thu", revenue: 73 },
		{ day: "Fri", revenue: 68 },
		{ day: "Sat", revenue: 91 },
		{ day: "Sun", revenue: 84 },
	],
	last: [
		{ day: "Mon", revenue: 64 },
		{ day: "Tue", revenue: 47 },
		{ day: "Wed", revenue: 70 },
		{ day: "Thu", revenue: 55 },
		{ day: "Fri", revenue: 82 },
		{ day: "Sat", revenue: 60 },
		{ day: "Sun", revenue: 71 },
	],
};

const ANIMATION = { type: "timing", duration: 600 } as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	toggle: { alignSelf: "center", backgroundColor: "#8E8E9326", borderRadius: 9, flexDirection: "row", padding: 2 },
	option: { borderRadius: 7, paddingHorizontal: 14, paddingVertical: 6 },
	selected: { backgroundColor: "#0A84FF" },
	label: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	selectedLabel: { color: "#FFFFFF" },
	chart: { height: 220, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const [week, setWeek] = useState<Week>("this");

	return (
		<View style={styles.root}>
			<View style={styles.toggle}>
				{WEEKS.map((option) => (
					<Pressable
						key={option}
						onPress={() => setWeek(option)}
						style={[styles.option, option === week && styles.selected]}
						testID={`charts-morph-${option}`}
					>
						<Text style={[styles.label, option === week && styles.selectedLabel]}>{LABELS[option]}</Text>
					</Pressable>
				))}
			</View>
			<View style={styles.chart}>
				<CartesianChart
					animation={ANIMATION}
					curve="monotone"
					data={DATA[week]}
					domain={{ y: [0, 100] }}
					font={font}
					xKey="day"
					yKeys={["revenue"]}
				>
					<ChartGrid color="#8E8E9340" />
					<ChartYAxis color="#8E8E93" />
					<ChartXAxis color="#8E8E93" />
					<ChartArea color="#0A84FF22" yKey="revenue" />
					<ChartLine color="#0A84FF" strokeWidth={2} yKey="revenue" />
				</CartesianChart>
			</View>
		</View>
	);
}
