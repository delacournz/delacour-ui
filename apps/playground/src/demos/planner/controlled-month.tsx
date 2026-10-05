import { Button } from "@delacour/react-native-ui/button";
import { Planner } from "@delacour/react-native-ui/planner";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A month you hold",
	caption:
		"`month` and `onMonthChange` put the month in your state. This parent refuses anything past December — the grid stays, nothing slides, and nothing is announced.",
	align: "stretch",
};

const LAST = new Date(new Date().getFullYear(), 11, 1);

export function Demo(): ReactElement {
	const [month, setMonth] = useState(() => new Date());
	const [selected, setSelected] = useState<Date | null>(null);
	const [refused, setRefused] = useState(0);

	return (
		<View className="gap-3">
			<Planner
				month={month}
				onMonthChange={(next) => {
					if (next > LAST) setRefused((count) => count + 1);
					else setMonth(next);
				}}
				onSelectedChange={setSelected}
				selected={selected}
			>
				<Planner.Header>
					<Planner.Title />
					<Planner.Today />
					<Planner.Nav testID="planner-controlled-nav" />
				</Planner.Header>
				<Planner.Grid />
			</Planner>
			<Text.Caption>
				{selected ? `Selected ${selected.toDateString()}` : "Nothing selected"} · refused {refused}
			</Text.Caption>
			<Button onPress={() => setMonth(new Date(new Date().getFullYear(), 0, 1))} size="sm" variant="outline">
				Jump to January
			</Button>
		</View>
	);
}
