import { ATTACHMENT_SIZES, Attachment, type AttachmentSize } from "@delacour/react-native-ui/attachment";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The preview square and the tile are fixed points, so a tray lines up; the name and meta are type and scale with the reader's setting.",
};

const LABELS: Record<AttachmentSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

const PHOTO = { uri: "https://picsum.photos/seed/garden/320" };

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{ATTACHMENT_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Overline>{LABELS[size]}</Text.Overline>
					<Attachment kind="file" name="specification.pdf" size={size} sizeBytes={612_352} />
					<View className="flex-row items-start gap-2">
						<Attachment kind="image" layout="tile" name="garden.jpg" size={size} source={PHOTO} />
						<View className="flex-1">
							<Attachment kind="audio" durationMs={128_000} layout="card" name="Site recording" size={size} />
						</View>
					</View>
				</View>
			))}
		</View>
	);
}
