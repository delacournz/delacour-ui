import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Captions and full resolution",
	align: "center",
	caption:
		"The 200 px thumbnail draws the instant the viewer opens; the 1600 px source fades in over it once it loads. Captions sit at the foot and are read with the image.",
};

const PHOTOS = [
	{ id: "dunes", alt: "Wind-ribbed sand dunes", caption: "Dunes, late afternoon" },
	{ id: "glacier", alt: "A glacier tongue in a valley", caption: "Glacier, from the terminal lake" },
] as const;

export function Demo(): ReactElement {
	return (
		<ImageViewer>
			<View className="flex-row gap-3">
				{PHOTOS.map((photo) => (
					<ImageViewer.Trigger
						alt={photo.alt}
						caption={photo.caption}
						className="size-36 rounded-lg"
						fullSource={{ uri: `https://picsum.photos/seed/${photo.id}/1600/1600` }}
						id={photo.id}
						key={photo.id}
						source={{ uri: `https://picsum.photos/seed/${photo.id}/200/200` }}
					/>
				))}
			</View>
		</ImageViewer>
	);
}
