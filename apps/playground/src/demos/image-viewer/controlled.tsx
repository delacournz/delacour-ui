import { Button } from "@delacour/react-native-ui/button";
import { ImageViewer } from "@delacour/react-native-ui/image-viewer";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	align: "stretch",
	caption:
		"open and index belong to the caller. The buttons open the viewer straight at an image; onIndexChange reports each swipe.",
};

const PHOTOS = [
	{ id: "bay", alt: "A sheltered bay" },
	{ id: "pass", alt: "A mountain pass" },
	{ id: "falls", alt: "A waterfall in bush" },
] as const;

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	const openAt = (at: number) => {
		setIndex(at);
		setOpen(true);
	};

	return (
		<ImageViewer index={index} onIndexChange={setIndex} onOpenChange={setOpen} open={isOpen}>
			<View className="gap-3">
				<View className="flex-row gap-2">
					{PHOTOS.map((photo) => (
						<ImageViewer.Trigger
							alt={photo.alt}
							className="aspect-square flex-1 rounded-md"
							id={photo.id}
							key={photo.id}
							source={{ uri: `https://picsum.photos/seed/${photo.id}/600/600` }}
						/>
					))}
				</View>
				<View className="flex-row items-center justify-between">
					<Button onPress={() => openAt(0)} size="sm" testID="image-viewer-open-first" variant="secondary">
						<Button.Label>Open first</Button.Label>
					</Button>
					<Text color="muted">{`Image ${index + 1} of ${PHOTOS.length}`}</Text>
					<Button
						onPress={() => openAt(PHOTOS.length - 1)}
						size="sm"
						testID="image-viewer-open-last"
						variant="secondary"
					>
						<Button.Label>Open last</Button.Label>
					</Button>
				</View>
			</View>
		</ImageViewer>
	);
}
