import {
	CartesianChart,
	ChartCursorDot,
	ChartCursorLine,
	ChartGrid,
	ChartLine,
	type ChartScrubState,
	ChartXAxis,
	ChartYAxis,
	useChartScrub,
	useSystemFont,
} from "@delacour/react-native-charts";
import { type ReactElement, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A readout on a plain view",
	caption:
		"Every field on the scrub is a number, so the pill above the chart is an ordinary `Animated.View`. `useAnimatedStyle` moves it with `snappedX` on the UI thread, and the text crosses to JavaScript only when the nearest datum's `index` changes.",
	capture: { align: "stretch", flow: "charts/cursor/readout" },
};

const DATA = [
	{ month: "Jan", revenue: 42 },
	{ month: "Feb", revenue: 58 },
	{ month: "Mar", revenue: 51 },
	{ month: "Apr", revenue: 73 },
	{ month: "May", revenue: 68 },
	{ month: "Jun", revenue: 91 },
];

const KEYS = ["revenue"] as const;

const PILL_WIDTH = 96;

const styles = StyleSheet.create({
	root: { gap: 8, width: "100%" },
	track: { height: 30, width: "100%" },
	pill: {
		alignItems: "center",
		backgroundColor: "#0A84FF",
		borderRadius: 15,
		height: 30,
		justifyContent: "center",
		position: "absolute",
		width: PILL_WIDTH,
	},
	pillText: { color: "#FFFFFF", fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "600" },
	chart: { height: 220, width: "100%" },
});

/** Follows the scrub on the UI thread; only the label text is React state. */
function Readout({ scrub }: { scrub: ChartScrubState }): ReactElement {
	const [index, setIndex] = useState(-1);
	const width = useSharedValue(0);

	useAnimatedReaction(
		() => scrub.index.value,
		(next, previous) => {
			if (next !== previous) scheduleOnRN(setIndex, next);
		}
	);

	const style = useAnimatedStyle(() => {
		const x = scrub.snappedX.value;
		const left = Number.isFinite(x) ? x - PILL_WIDTH / 2 : 0;
		return {
			opacity: scrub.isActive.value ? 1 : 0,
			transform: [{ translateX: Math.min(Math.max(left, 0), Math.max(width.value - PILL_WIDTH, 0)) }],
		};
	});

	const row = DATA[index];

	return (
		<View onLayout={(event: LayoutChangeEvent) => (width.value = event.nativeEvent.layout.width)} style={styles.track}>
			<Animated.View style={[styles.pill, style]}>
				<Text style={styles.pillText}>{row ? `${row.month} · $${row.revenue}k` : ""}</Text>
			</Animated.View>
		</View>
	);
}

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const scrub = useChartScrub(KEYS);

	return (
		<View style={styles.root}>
			<Readout scrub={scrub} />
			<View style={styles.chart} testID="charts-scrub-readout">
				<CartesianChart curve="monotone" data={DATA} font={font} scrub={scrub} xKey="month" yKeys={KEYS}>
					<ChartGrid color="#8E8E9340" />
					<ChartYAxis color="#8E8E93" />
					<ChartXAxis color="#8E8E93" />
					<ChartLine color="#0A84FF" strokeWidth={2} yKey="revenue" />
					<ChartCursorLine axis="x" color="#8E8E93" dash={[4, 4]} />
					<ChartCursorDot borderColor="#FFFFFF" color="#0A84FF" radius={5} yKey="revenue" />
				</CartesianChart>
			</View>
		</View>
	);
}
