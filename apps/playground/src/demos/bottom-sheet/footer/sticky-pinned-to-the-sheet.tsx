import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sticky — pinned to the sheet",
};

const SNAP_POINTS = ["50%"];

const PARAGRAPHS = [
	"An inline footer is part of the body. It is in the flow, it sits on the sheet's own surface, and it scrolls with everything above it.",
	"A sticky footer is not. It is lifted out of this tree and handed to gorhom, drawn over the content, and it brings a surface and a hairline so the content does not show through.",
	"Keep dragging. Under the sticky sheet the buttons stay put; under the inline one they leave with the text.",
];

/** A sibling of the scrollable rather than a child of it, so gorhom draws it over the content. */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="secondary">Open</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
					<BottomSheet.ScrollView>
						<BottomSheet.Title>Sticky footer</BottomSheet.Title>
						{PARAGRAPHS.map((paragraph) => (
							<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
						))}
					</BottomSheet.ScrollView>
					<BottomSheet.Footer sticky>
						<Button>Continue</Button>
						<Button variant="tertiary">Cancel</Button>
					</BottomSheet.Footer>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
