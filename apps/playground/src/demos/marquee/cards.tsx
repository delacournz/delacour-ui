import { Item } from "@delacour/react-native-ui/item";
import { Marquee } from "@delacour/react-native-ui/marquee";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tappable content",
	align: "stretch",
	caption:
		"Each card is a pressable `Item`. A tap still lands while the strip moves and while it is held — the hold never steals a child's press.",
};

const PLACES = [
	{ name: "Auckland", detail: "Partly cloudy, 18°" },
	{ name: "Wellington", detail: "Windy, 14°" },
	{ name: "Christchurch", detail: "Clear, 16°" },
	{ name: "Queenstown", detail: "Snow, 2°" },
] as const;

export function Demo(): ReactElement {
	const [last, setLast] = useState<string | null>(null);

	return (
		<View className="gap-3">
			<Marquee contentClassName="gap-2" gap="sm" speed={30} testID="marquee-cards">
				{PLACES.map((place) => (
					<Item
						className="w-48"
						key={place.name}
						onPress={() => setLast(place.name)}
						testID={`marquee-card-${place.name.toLowerCase()}`}
						variant="outline"
					>
						<Item.Content>
							<Item.Title>{place.name}</Item.Title>
							<Item.Description>{place.detail}</Item.Description>
						</Item.Content>
					</Item>
				))}
			</Marquee>
			<Text.Caption color="muted" testID="marquee-cards-last">
				{last === null ? "Tap a card" : `Tapped ${last}`}
			</Text.Caption>
		</View>
	);
}
