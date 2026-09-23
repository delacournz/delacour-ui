import {
	CartesianChart,
	ChartBar,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "@delacour/react-native-charts";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A spring",
	caption:
		'`{ type: "spring" }` takes Reanimated\'s own spring config. Every corner of a bar is a cubic, so a bar can overshoot and settle without its path ever changing shape.',
	capture: { align: "stretch", flow: "charts/animation/spring" },
};

type Region = "north" | "south";

const REGIONS = ["north", "south"] as const satisfies readonly Region[];

const LABELS: Record<Region, string> = {
	north: "North",
	south: "South",
};

const DATA: Record<Region, { month: string; units: number }[]> = {
	north: [
		{ month: "Jan", units: 42 },
		{ month: "Feb", units: 58 },
		{ month: "Mar", units: 51 },
		{ month: "Apr", units: 73 },
		{ month: "May", units: 68 },
		{ month: "Jun", units: 91 },
	],
	south: [
		{ month: "Jan", units: 78 },
		{ month: "Feb", units: 36 },
		{ month: "Mar", units: 64 },
		{ month: "Apr", units: 29 },
		{ month: "May", units: 85 },
		{ month: "Jun", units: 47 },
	],
};

const ANIMATION = { type: "spring", damping: 12, stiffness: 140 } as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	toggle: { alignSelf: "center", backgroundColor: "#8E8E9326", borderRadius: 9, flexDirection: "row", padding: 2 },
	option: { borderRadius: 7, paddingHorizontal: 14, paddingVertical: 6 },
	selected: { backgroundColor: "#30D158" },
	label: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	selectedLabel: { color: "#FFFFFF" },
	chart: { height: 220, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const [region, setRegion] = useState<Region>("north");

	return (
		<View style={styles.root}>
			<View style={styles.toggle}>
				{REGIONS.map((option) => (
					<Pressable
						key={option}
						onPress={() => setRegion(option)}
						style={[styles.option, option === region && styles.selected]}
						testID={`charts-spring-${option}`}
					>
						<Text style={[styles.label, option === region && styles.selectedLabel]}>{LABELS[option]}</Text>
					</Pressable>
				))}
			</View>
			<View style={styles.chart}>
				<CartesianChart
					animation={ANIMATION}
					data={DATA[region]}
					domain={{ y: [0, 100] }}
					domainPadding={{ x: 0.5 }}
					font={font}
					xKey="month"
					yKeys={["units"]}
				>
					<ChartGrid color="#8E8E9340" />
					<ChartYAxis color="#8E8E93" />
					<ChartXAxis color="#8E8E93" />
					<ChartBar color="#30D158" roundedCorners={{ topLeft: 4, topRight: 4 }} yKey="units" />
				</CartesianChart>
			</View>
		</View>
	);
}
