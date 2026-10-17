import { ImageViewer, type ImageViewerImage } from "@delacour/react-native-ui/image-viewer";
import type { ReactElement } from "react";
import { FlatList } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Data mode",
	align: "stretch",
	caption:
		"For a virtualised list, pass images to the root and an index to each Trigger. The gallery stays thirty long however many rows are mounted.",
};

const IMAGES: readonly ImageViewerImage[] = Array.from({ length: 30 }, (_, i) => ({
	alt: `Photo ${i + 1} of the roll`,
	fullSource: { uri: `https://picsum.photos/seed/roll-${i}/1200/1200` },
	height: 1200,
	id: `roll-${i}`,
	source: { uri: `https://picsum.photos/seed/roll-${i}/200/200` },
	width: 1200,
}));

const GAP = { gap: 4 } as const;

export function Demo(): ReactElement {
	return (
		<ImageViewer images={IMAGES}>
			<FlatList
				className="h-80"
				columnWrapperStyle={GAP}
				contentContainerStyle={GAP}
				data={IMAGES}
				keyExtractor={(image) => image.id}
				numColumns={3}
				renderItem={({ index }) => <ImageViewer.Trigger className="aspect-square flex-1" index={index} />}
			/>
		</ImageViewer>
	);
}
