import { Icon } from "@delacour/react-native-ui/icon";
import { IconChart1 } from "@delacour/react-native-ui/icons/central";
import { KPI_COLOR_INDEXES, Kpi } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Series colours",
	caption:
		"`colorIndex` is set on the card, and the icon and the sparkline share it — five cards, five slots of the theme's series ramp. The change ignores it: a series colour has nothing to say about good or bad news.",
};

const SHAPES: readonly (readonly number[])[] = [
	[3, 4, 3.6, 5, 4.8, 6],
	[6, 5.2, 5.6, 4.9, 5.1, 4.4],
	[2, 2.4, 3.1, 2.9, 3.8, 4.2],
	[5, 5.4, 5.1, 5.6, 5.2, 5.5],
	[1, 1.8, 2.6, 2.4, 3.3, 4.1],
];

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{KPI_COLOR_INDEXES.map((colorIndex, index) => (
				<Kpi colorIndex={colorIndex} key={colorIndex} size="sm" testID={`kpi-colour-${colorIndex}`}>
					<Kpi.Content className="items-center" layout="inline">
						<Kpi.Icon>
							<Icon icon={IconChart1} />
						</Kpi.Icon>
						<Kpi.Stat>
							<Kpi.Title>Series {colorIndex}</Kpi.Title>
						</Kpi.Stat>
						<Kpi.Sparkline data={SHAPES[index] ?? []} interactive={false} />
					</Kpi.Content>
				</Kpi>
			))}
		</View>
	);
}
