import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { Image, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom thumbnail",
	align: "stretch",
	caption:
		"Children replace the drawn thumbnail — here a list row with the photo beside its title. The viewer still opens on the Trigger's own image.",
	capture: { align: "stretch" },
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
				<View className="flex-row items-center gap-3 p-2">
					<Image className="h-16 w-20 rounded-md" source={SOURCE} />
					<View className="flex-1 gap-0.5">
						<Text weight="semibold">Hut, second night</Text>
						<Text color="muted" size="sm">
							Tap to view full screen
						</Text>
					</View>
				</View>
			</ImageViewer.Trigger>
		</ImageViewer>
	);
}
