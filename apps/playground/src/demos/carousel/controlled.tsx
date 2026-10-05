import { Button } from "@delacour/react-native-ui/button";
import { Carousel } from "@delacour/react-native-ui/carousel";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"index and onIndexChange hand the slide to the caller. onIndexChange fires once per swipe, from the release.",
};

const COLOURS = ["bg-primary", "bg-success", "bg-warning", "bg-destructive", "bg-info"] as const;

export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);

	return (
		<View className="gap-3">
			<Carousel accessibilityLabel="Colours" index={index} onIndexChange={setIndex} testID="carousel-controlled">
				<Carousel.Content aspectRatio={2}>
					{COLOURS.map((colour, slide) => (
						<Carousel.Item className={colour} key={colour} testID={`carousel-item-${slide}`} />
					))}
				</Carousel.Content>
			</Carousel>
			<View className="flex-row items-center justify-between">
				<Button onPress={() => setIndex(0)} size="sm" testID="carousel-first" variant="secondary">
					<Button.Label>First</Button.Label>
				</Button>
				<Text color="muted">{`Slide ${index + 1} of ${COLOURS.length}`}</Text>
				<Button onPress={() => setIndex(COLOURS.length - 1)} size="sm" testID="carousel-last" variant="secondary">
					<Button.Label>Last</Button.Label>
				</Button>
			</View>
		</View>
	);
}
