import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const SNAP_POINTS = ["35%", "70%"];

/**
 * The two ways a sheet decides how tall it is.
 *
 * Dynamic sizing is gorhom's default and this component keeps it, so the common
 * case — a title, some copy and two buttons — needs no numbers at all. Snap
 * points are for a sheet whose height is a decision rather than a measurement,
 * and for anything that has to scroll.
 */
export default function BottomSheetSizingDemo(): ReactElement {
	return (
		<GalleryScreen subtitle="Dynamic, snapped and capped" title="Sizing">
			<Section title="Sized to its content">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="secondary">Short sheet</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>One line</BottomSheet.Title>
								<BottomSheet.Description>The sheet is exactly as tall as this.</BottomSheet.Description>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="The same sheet, more content">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="secondary">Tall sheet</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>Still no numbers</BottomSheet.Title>
								{PARAGRAPHS.map((paragraph) => (
									<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
								))}
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="Explicit snap points">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="outline">Two stops</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
							<BottomSheet.Content className="flex-1">
								<BottomSheet.Title>Drag the handle up</BottomSheet.Title>
								<BottomSheet.Description>
									35% and 70%. The scrim is there from the first stop, not the second.
								</BottomSheet.Description>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="Dynamic, but capped">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="outline">Capped at 320pt</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container maxDynamicContentSize={320}>
							<BottomSheet.Content>
								<BottomSheet.Title>More content than fits</BottomSheet.Title>
								{PARAGRAPHS.map((paragraph) => (
									<BottomSheet.Description key={paragraph}>{paragraph}</BottomSheet.Description>
								))}
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
				<Text.Caption>
					The capped sheet stops growing but does not scroll — content past the cap is unreachable. That is what
					BottomSheet.ScrollView is for.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}

const PARAGRAPHS = [
	"A sheet sized to its content needs no snap points, because the content is the measurement.",
	"Add a paragraph and the sheet is taller. Remove one and it is shorter, with nothing said at the call site.",
	"This is gorhom's own default, and this component keeps it — a number here would be a number to retune every time the copy changed.",
];
