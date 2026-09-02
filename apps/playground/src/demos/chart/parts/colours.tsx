import { CHART_SERIES_TOKENS, Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "stretch",
	caption:
		"A series takes its ramp slot by position. Name a token to move it, or a literal to leave the ramp entirely.",
	note: "The ramp stops at five and cycles, because five is what a pasted shadcn palette supplies.",
};

const DATA = [
	{ i: "A", a: 20, b: 34, c: 28, d: 44, e: 38 },
	{ i: "B", a: 32, b: 26, c: 41, d: 30, e: 52 },
	{ i: "C", a: 45, b: 39, c: 33, d: 55, e: 41 },
	{ i: "D", a: 38, b: 52, c: 47, d: 42, e: 60 },
];

const RAMP = Object.fromEntries(
	CHART_SERIES_TOKENS.map((token, index) => [`s${index}`, { label: token, color: token }])
);

const RAMP_DATA = DATA.map((row, index) => ({
	i: row.i,
	s0: 20 + index * 8,
	s1: 30 + index * 6,
	s2: 40 + index * 4,
	s3: 50 + index * 2,
	s4: 60 - index * 2,
}));

const OVERRIDES = {
	byPosition: { label: "By position" },
	byToken: { label: "chart-5", color: "chart-5" },
	byLiteral: { label: "#EC4899", color: "#EC4899" },
};

const OVERRIDE_DATA = DATA.map((row) => ({
	i: row.i,
	byPosition: row.a,
	byToken: row.b,
	byLiteral: row.c,
}));

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">The whole ramp</Text>
				<Chart config={RAMP} data={RAMP_DATA} size="sm" xKey="i">
					<Chart.Grid />
					<Chart.Line yKey="s0" />
					<Chart.Line yKey="s1" />
					<Chart.Line yKey="s2" />
					<Chart.Line yKey="s3" />
					<Chart.Line yKey="s4" />
					<Chart.Legend />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Position, token, literal</Text>
				<Chart config={OVERRIDES} data={OVERRIDE_DATA} size="sm" xKey="i">
					<Chart.Grid />
					<Chart.Line yKey="byPosition" />
					<Chart.Line yKey="byToken" />
					<Chart.Line yKey="byLiteral" />
					<Chart.Legend />
				</Chart>
			</View>
		</View>
	);
}
