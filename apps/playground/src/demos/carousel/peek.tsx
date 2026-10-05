import { Carousel } from "@delacour/react-native-ui/carousel";
import type { ReactElement } from "react";
import { Image } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Peek",
	caption: "An itemSize smaller than the viewport centres the active slide and lets its neighbours show either side.",
};

const SEEDS = ["fern", "kauri", "pohutukawa", "rimu", "totara", "manuka"] as const;

export function Demo(): ReactElement {
	return (
		<Carousel accessibilityLabel="Trees" itemSize={260} testID="carousel-peek">
			<Carousel.Content aspectRatio={1.2}>
				{SEEDS.map((seed, index) => (
					<Carousel.Item key={seed} testID={`carousel-item-${index}`}>
						<Image className="size-full" source={{ uri: `https://picsum.photos/seed/${seed}/600/700` }} />
					</Carousel.Item>
				))}
			</Carousel.Content>
			<Carousel.Dots />
		</Carousel>
	);
}
