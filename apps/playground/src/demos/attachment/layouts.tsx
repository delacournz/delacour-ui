import { Attachment } from "@delacour/react-native-ui/attachment";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Layouts",
	note: "`chip` is the composer pill, `tile` a square thumbnail for a photo tray, `card` a full-width row for inside a message.",
	capture: { align: "stretch" },
};

const PHOTO = { uri: "https://picsum.photos/seed/terrace/320" };

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-2">
				<Text.Overline>Chip</Text.Overline>
				<Attachment
					kind="file"
					name="site-plan.pdf"
					onRemove={() => undefined}
					sizeBytes={1_258_291}
					testID="attachment-layout-chip"
				/>
			</View>
			<View className="gap-2">
				<Text.Overline>Tile</Text.Overline>
				<View className="flex-row gap-2">
					<Attachment
						kind="image"
						layout="tile"
						name="terrace.jpg"
						onRemove={() => undefined}
						source={PHOTO}
						testID="attachment-layout-tile"
					/>
					<Attachment kind="audio" durationMs={74_000} layout="tile" name="Walkthrough" />
				</View>
			</View>
			<View className="gap-2">
				<Text.Overline>Card</Text.Overline>
				<Attachment
					kind="file"
					layout="card"
					name="contract-signed.docx"
					onPress={() => undefined}
					sizeBytes={88_064}
					testID="attachment-layout-card"
				/>
			</View>
		</View>
	);
}
