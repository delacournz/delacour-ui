import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Drag to dismiss",
	align: "center",
	caption:
		"Drag the open photo up or down. The stage fades as it goes; past 15% of the screen, or with a flick, it flies home to the thumbnail. A shorter drag springs back.",
	capture: { flow: "image-viewer/drag-to-dismiss", frame: "device" },
};

/**
 * Captured as a whole screen, because the viewer is a full-screen Modal: the
 * stage hands a `device` demo the full window with no insets, so the root fills
 * and centres itself rather than leaving the thumbnail under the Dynamic Island.
 */
export function Demo(): ReactElement {
	return (
		<ImageViewer>
			<View className="flex-1 items-center justify-center">
				<ImageViewer.Trigger
					alt="A lighthouse on a headland"
					className="size-40 rounded-full"
					height={1600}
					id="lighthouse"
					source={{ uri: "https://picsum.photos/seed/lighthouse/1200/1600" }}
					width={1200}
				/>
			</View>
		</ImageViewer>
	);
}
