import { Attachment, type AttachmentMedia } from "@delacour/react-native-ui/attachment";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A composer tray",
	note: "`Attachment.Group` scrolls sideways, hands its layout down, and slides the rest along when one is removed. Each attachment hears where it sits — `2 of 4`.",
	capture: { align: "stretch" },
};

type Draft = AttachmentMedia & { id: string; name: string; sizeBytes?: number };

const INITIAL: readonly Draft[] = [
	{
		id: "a",
		kind: "image",
		name: "kitchen.jpg",
		sizeBytes: 1_887_436,
		source: { uri: "https://picsum.photos/seed/kitchen/240" },
	},
	{ id: "b", kind: "file", name: "quote-v2.pdf", sizeBytes: 241_664 },
	{
		id: "c",
		kind: "image",
		name: "bathroom.jpg",
		sizeBytes: 2_202_009,
		source: { uri: "https://picsum.photos/seed/bath/240" },
	},
	{ id: "d", kind: "audio", durationMs: 31_000, name: "Notes for the builder" },
];

export function Demo(): ReactElement {
	const [drafts, setDrafts] = useState(INITIAL);

	return (
		<View className="gap-3">
			<Attachment.Group layout="tile" testID="attachment-tray">
				{drafts.map(({ id, ...draft }) => (
					<Attachment
						key={id}
						onRemove={() => setDrafts((current) => current.filter((item) => item.id !== id))}
						removeTestID={`attachment-tray-remove-${id}`}
						{...draft}
					/>
				))}
			</Attachment.Group>
			<Button onPress={() => setDrafts(INITIAL)} size="sm" testID="attachment-tray-reset" variant="secondary">
				<Button.Label>Reset tray</Button.Label>
			</Button>
		</View>
	);
}
