import { Carousel } from "@delacour/react-native-ui/carousel";
import type { ReactElement } from "react";
import { Image } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Track",
	align: "stretch",
	caption:
		"One slide per screen, swiped sideways. The dots are a reading of the same position the slides are, so the pill travels with the finger.",
	capture: { align: "stretch", flow: "carousel/hero-track", hero: true },
};

const PHOTOS = [
	{ id: "harbour", title: "Harbour at dawn" },
	{ id: "ridge", title: "Ridge line" },
	{ id: "orchard", title: "Orchard rows" },
	{ id: "coast", title: "West coast" },
	{ id: "lake", title: "Still lake" },
] as const;

export function Demo(): ReactElement {
	return (
		<Carousel accessibilityLabel="Featured" testID="carousel-hero">
			<Carousel.Content testID="carousel-hero-content" aspectRatio={4 / 3}>
				{PHOTOS.map((photo, index) => (
					<Carousel.Item key={photo.id} testID={`carousel-item-${index}`}>
						<Image className="size-full" source={{ uri: `https://picsum.photos/seed/${photo.id}/800/600` }} />
						<Carousel.Caption>{photo.title}</Carousel.Caption>
					</Carousel.Item>
				))}
			</Carousel.Content>
			<Carousel.Dots testID="carousel-dots" />
		</Carousel>
	);
}
