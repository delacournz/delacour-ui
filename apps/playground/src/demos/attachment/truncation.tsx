import { Attachment } from "@delacour/react-native-ui/attachment";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long names and missing details",
	note: "A long name is cut in the middle so its extension stays in view. With no size the meta line shows only the type; with no extension it shows nothing.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Attachment
				kind="file"
				name="2026-q3-board-pack-final-final-revised-with-comments.pdf"
				onRemove={() => undefined}
				sizeBytes={12_582_912}
			/>
			<Attachment kind="file" layout="card" name="minutes-of-the-annual-general-meeting-held-in-september.docx" />
			<Attachment kind="file" name="LICENSE" />
			<Attachment kind="file" name="archive.tar.gz" sizeBytes={73_400_320} />
		</View>
	);
}
