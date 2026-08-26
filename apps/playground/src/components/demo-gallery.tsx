import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";
import type { DemoEntry } from "@/demos/types";

export type DemoGalleryProps = {
	title: string;
	/** Defaults to the demo count. Pass one only when a gallery has something better to say. */
	subtitle?: string;
	demos: readonly DemoEntry[];
};

/**
 * A gallery, rendered from a demo group.
 *
 * `GalleryScreen` and `Section` are untouched — this only composes them, so a
 * screen that genuinely needs to be hand-written still can, and the five folder
 * index routes still are.
 *
 * `caption` runs above the demo and `note` below it, because the galleries
 * disagree about which reads better and both are right: `switch` explains
 * before it shows, `tabs/swipe` shows and then explains. Collapsing them to one
 * slot would reorder somebody's prose.
 *
 * `keyboardAware` is ORed across the group rather than passed per gallery. The
 * demo holding the text field is the thing that knows, so a gallery that gains
 * one needs no second edit here.
 */
export function DemoGallery({ title, subtitle, demos }: DemoGalleryProps): ReactElement {
	return (
		<GalleryScreen
			keyboardAware={demos.some((demo) => demo.keyboardAware)}
			subtitle={subtitle ?? `${demos.length} demos`}
			title={title}
		>
			{demos.map(({ Demo, caption, id, note, title: sectionTitle }) => (
				<Section key={id} title={sectionTitle}>
					{caption ? <Text.Caption>{caption}</Text.Caption> : null}
					<Demo />
					{note ? <Text.Caption>{note}</Text.Caption> : null}
				</Section>
			))}
		</GalleryScreen>
	);
}
