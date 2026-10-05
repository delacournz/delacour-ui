import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { Image, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom thumbnail",
	align: "stretch",
	caption:
		"Children replace the drawn thumbnail — here a card with a title under the photo. The viewer still opens on the Trigger's own image.",
};

const SOURCE = { uri: "https://picsum.photos/seed/cabin/800/600" };

export function Demo(): ReactElement {
	return (
		<ImageViewer>
			<ImageViewer.Trigger
				alt="A wooden cabin under snow"
				caption="Hut, second night"
				className="rounded-xl border border-border bg-card"
				height={600}
				id="cabin"
				source={SOURCE}
				width={800}
			>
				<Image className="aspect-[4/3] w-full" source={SOURCE} />
				<View className="gap-1 p-3">
					<Text weight="semibold">Hut, second night</Text>
					<Text color="muted" size="sm">
						Tap to view full screen
					</Text>
				</View>
			</ImageViewer.Trigger>
		</ImageViewer>
	);
}
