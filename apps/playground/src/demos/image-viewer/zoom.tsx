import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Zoom",
	align: "center",
	caption:
		"Double-tap zooms to 2.5× about the point you tapped, and back. A pinch holds the point under your fingers; past 1× or 4× it gives, then settles.",
};

export function Demo(): ReactElement {
	return (
		<ImageViewer>
			<ImageViewer.Trigger
				alt="A city map, dense with street names"
				className="h-48 w-72 rounded-lg"
				fullSource={{ uri: "https://picsum.photos/seed/map/1600/1067" }}
				height={1067}
				id="map"
				source={{ uri: "https://picsum.photos/seed/map/300/200" }}
				width={1600}
			/>
		</ImageViewer>
	);
}
