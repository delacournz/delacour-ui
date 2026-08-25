import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const SNAP_POINTS = ["50%"];

const PARAGRAPHS = [
	"An inline footer is part of the body. It is in the flow, it sits on the sheet's own surface, and it scrolls with everything above it.",
	"A sticky footer is not. It is lifted out of this tree and handed to gorhom, drawn over the content, and it brings a surface and a hairline so the content does not show through.",
	"Keep dragging. Under the sticky sheet the buttons stay put; under the inline one they leave with the text.",
];

/**
 * Inline and sticky, side by side.
 *
 * `sticky` is off by default, matching `Screen.Footer`. The difference is only
 * visible once the body is long enough to move under it, which is why both
 * sheets here are snapped rather than sized to their content.
 */
export default function BottomSheetFooterDemo(): ReactElement {
	return (
		<GalleryScreen subtitle="Inline by default, sticky on request" title="Footer">
			<Section title="Inline — in the flow">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="secondary">Open</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
							<BottomSheet.ScrollView>
								<BottomSheet.Title>Inline footer</BottomSheet.Title>
								{PARAGRAPHS.map((paragraph) => (
									<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
								))}
								<BottomSheet.Footer>
									<Button>Continue</Button>
									<Button variant="tertiary">Cancel</Button>
								</BottomSheet.Footer>
							</BottomSheet.ScrollView>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="Sticky — pinned to the sheet">
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
			</Section>

			<Section title="On a short sheet, sticky still pins">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="outline">Open</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>Nothing to scroll</BottomSheet.Title>
								<BottomSheet.Description>
									The content reserves the footer&apos;s height, so the two do not overlap even here.
								</BottomSheet.Description>
							</BottomSheet.Content>
							<BottomSheet.Footer sticky>
								<Button>Done</Button>
							</BottomSheet.Footer>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
				<Text.Caption>
					Compare the last two against the home indicator. The pinned footer&apos;s surface should run to the bottom of
					the sheet with the buttons above the indicator, never behind it.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}
