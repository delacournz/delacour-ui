import { Carousel } from "@delacour/react-native-ui/carousel";
import type { ReactElement } from "react";
import { Image } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loop and autoplay",
	align: "stretch",
	caption:
		"loop leads the last slide back to the first with no jump. autoplay advances on a timer and stops for good on the first touch.",
	note: "Autoplay never runs under reduce motion or while a screen reader is on.",
};

const SEEDS = ["sunrise", "noon", "golden", "twilight", "night"] as const;

export function Demo(): ReactElement {
	return (
		<Carousel accessibilityLabel="Times of day" autoplay autoplayInterval={2500} loop testID="carousel-loop">
			<Carousel.Content aspectRatio={16 / 9}>
				{SEEDS.map((seed, index) => (
					<Carousel.Item key={seed} testID={`carousel-item-${index}`}>
						<Image className="size-full" source={{ uri: `https://picsum.photos/seed/${seed}/800/450` }} />
					</Carousel.Item>
				))}
			</Carousel.Content>
			<Carousel.Dots />
		</Carousel>
	);
}
