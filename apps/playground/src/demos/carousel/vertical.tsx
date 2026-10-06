import { Carousel } from "@delacour/react-native-ui/carousel";
import type { ReactElement } from "react";
import { Image } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	align: "stretch",
	caption:
		'orientation="vertical" pages up and down, like a stack of stories. A vertical viewport takes its height from a class.',
};

const STORIES = ["morning", "market", "ferry", "evening"] as const;

export function Demo(): ReactElement {
	return (
		<Carousel accessibilityLabel="Stories" className="flex-row" orientation="vertical" testID="carousel-vertical">
			<Carousel.Content className="h-96 flex-1">
				{STORIES.map((story, index) => (
					<Carousel.Item key={story} testID={`carousel-item-${index}`}>
						<Image className="size-full" source={{ uri: `https://picsum.photos/seed/${story}/600/900` }} />
						<Carousel.Caption>{story}</Carousel.Caption>
					</Carousel.Item>
				))}
			</Carousel.Content>
			<Carousel.Dots />
		</Carousel>
	);
}
