import { Badge } from "@delacour/react-native-ui/badge";
import { Marquee } from "@delacour/react-native-ui/marquee";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Speed",
	caption:
		"Speed is points per second, never a duration — so a short strip and a long one at the same speed move at the same pace.",
	align: "stretch",
	capture: { align: "stretch", flow: true },
};

const SPEEDS = [20, 60, 120] as const;
const ITEMS = ["One", "Two", "Three", "Four", "Five"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{SPEEDS.map((speed) => (
				<View className="gap-1" key={speed}>
					<Text.Caption color="muted">{`${speed} pt/s`}</Text.Caption>
					<Marquee contentClassName="gap-2" gap="sm" speed={speed} testID={`marquee-speed-${speed}`}>
						{ITEMS.map((item) => (
							<Badge key={item} variant="soft">
								{item}
							</Badge>
						))}
					</Marquee>
				</View>
			))}
		</View>
	);
}
