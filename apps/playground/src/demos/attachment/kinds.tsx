import { Attachment, type AttachmentMedia } from "@delacour/react-native-ui/attachment";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Kinds",
	note: "The kind picks the glyph and its tint. An image draws its picture over the glyph, so a dead link leaves the glyph rather than a hole; a video's poster is optional; a file reads its extension from the name.",
	capture: { align: "stretch" },
};

type Sample = AttachmentMedia & { id: string; name: string; sizeBytes?: number };

const SAMPLES: readonly Sample[] = [
	{
		id: "image",
		kind: "image",
		name: "harbour-at-dusk.jpg",
		sizeBytes: 2_516_582,
		source: { uri: "https://picsum.photos/seed/harbour/240" },
	},
	{ durationMs: 42_000, id: "video", kind: "video", name: "launch-teaser.mov", sizeBytes: 18_874_368 },
	{ durationMs: 95_000, id: "audio", kind: "audio", name: "Voice memo" },
	{ id: "file", kind: "file", name: "quarterly-report.pdf", sizeBytes: 482_304 },
];

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SAMPLES.map(({ id, ...sample }) => (
				<Attachment key={id} testID={`attachment-kind-${id}`} {...sample} />
			))}
		</View>
	);
}
