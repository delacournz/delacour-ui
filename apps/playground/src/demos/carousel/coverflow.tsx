import { Carousel } from "@delacour/react-native-ui/carousel";
import type { ReactElement } from "react";
import { Image } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Coverflow",
	align: "stretch",
	caption:
		"The coverflow variant turns, shrinks and fades each slide by its distance from the centre. Under reduce motion it draws as a plain track.",
	capture: { align: "stretch", flow: "carousel/coverflow" },
};

const ALBUMS = ["vinyl", "tape", "studio", "stage", "neon", "dusk", "echo"] as const;

export function Demo(): ReactElement {
	return (
		<Carousel
			accessibilityLabel="Albums"
			defaultIndex={3}
			itemSize={200}
			testID="carousel-coverflow"
			variant="coverflow"
		>
			<Carousel.Content testID="carousel-coverflow-content" aspectRatio={1.6}>
				{ALBUMS.map((album, index) => (
					<Carousel.Item key={album} testID={`carousel-item-${index}`}>
						<Image className="size-full" source={{ uri: `https://picsum.photos/seed/${album}/600/600` }} />
					</Carousel.Item>
				))}
			</Carousel.Content>
		</Carousel>
	);
}
