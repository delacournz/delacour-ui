import { Badge } from "@delacour/react-native-ui/badge";
import { Card } from "@delacour/react-native-ui/card";
import { Compare } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ScopedTheme } from "uniwind";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "One card, two themes",
	caption:
		"Each side takes any children — here the same `Card` rendered under a light and a dark `ScopedTheme`. Both are laid out at the full frame, so the seam cuts one card in half rather than squeezing two.",
	align: "stretch",
	capture: { align: "stretch", flow: "compare/themes" },
};

/** The card under test, identical on both sides. */
function Report(): ReactElement {
	return (
		<View className="flex-1 justify-center bg-background p-4">
			<Card>
				<Card.Header>
					<Card.Title>Monthly report</Card.Title>
					<Card.Description>Revenue and retention for October.</Card.Description>
					<Card.Action>
						<Badge color="success" size="sm" variant="soft">
							+12%
						</Badge>
					</Card.Action>
				</Card.Header>
				<Card.Content>
					<Text.Title>$48,120</Text.Title>
				</Card.Content>
			</Card>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<Compare accessibilityLabel="Light and dark theme" className="h-64">
			<Compare.Before>
				<ScopedTheme theme="light">
					<Report />
				</ScopedTheme>
			</Compare.Before>
			<Compare.After>
				<ScopedTheme theme="dark">
					<Report />
				</ScopedTheme>
			</Compare.After>
			<Compare.Label placement="end" side="before">
				Light
			</Compare.Label>
			<Compare.Label placement="end" side="after">
				Dark
			</Compare.Label>
			<Compare.Handle testID="compare-themes-handle" />
		</Compare>
	);
}
