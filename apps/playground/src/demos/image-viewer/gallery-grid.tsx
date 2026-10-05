import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Gallery",
	align: "stretch",
	caption:
		"Tap a tile: the photo grows out of its own frame. Swipe sideways through the six, pinch or double-tap to zoom, drag down to send it back.",
	capture: { flow: "image-viewer/gallery-grid", frame: "device", hero: true },
};

const PHOTOS = [
	{ id: "harbour", alt: "A harbour at dawn" },
	{ id: "ridge", alt: "A ridge line above cloud" },
	{ id: "orchard", alt: "Rows of an orchard" },
	{ id: "coast", alt: "Surf on a west coast beach" },
	{ id: "lake", alt: "A still alpine lake" },
	{ id: "forest", alt: "Ferns on a forest floor" },
] as const;

/**
 * Captured as a whole screen, because the viewer is a full-screen Modal: the
 * stage hands a `device` demo the full window with no insets, so the root fills
 * and centres itself rather than leaving the thumbnail under the Dynamic Island.
 */
export function Demo(): ReactElement {
	return (
		<ImageViewer>
			<View className="flex-1 justify-center px-4">
				<View className="flex-row flex-wrap gap-2">
					{PHOTOS.map((photo) => (
						<ImageViewer.Trigger
							alt={photo.alt}
							className="aspect-square w-[31%] rounded-md"
							fullSource={{ uri: `https://picsum.photos/seed/${photo.id}/1600/1200` }}
							id={photo.id}
							key={photo.id}
							source={{ uri: `https://picsum.photos/seed/${photo.id}/200/150` }}
							width={1600}
							height={1200}
						/>
					))}
				</View>
			</View>
		</ImageViewer>
	);
}
