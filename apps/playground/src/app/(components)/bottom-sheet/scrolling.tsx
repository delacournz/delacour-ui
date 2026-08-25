import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const SNAP_POINTS = ["55%", "90%"];
const ROWS = Array.from({ length: 24 }, (_, index) => `Row ${index + 1}`);

/**
 * A body taller than the sheet.
 *
 * The thing to check here is the gesture hand-off, which no screenshot shows:
 * with the list scrolled to its top, a drag down moves the SHEET; with the list
 * scrolled anywhere else, the same drag moves the LIST. That negotiation is why
 * this has to be gorhom's scrollable and not a React Native one.
 */
export default function BottomSheetScrollingDemo(): ReactElement {
	return (
		<GalleryScreen subtitle="And the pan it negotiates with" title="Scrolling">
			<Section title="A scrolling sheet">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="secondary">Open a long list</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
							<BottomSheet.ScrollView>
								<ListGroup>
									{ROWS.map((row) => (
										<ListGroup.Item key={row}>{row}</ListGroup.Item>
									))}
								</ListGroup>
							</BottomSheet.ScrollView>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="Scrolling under a pinned footer">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="outline">Open with a footer</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
							<BottomSheet.ScrollView>
								<ListGroup>
									{ROWS.map((row) => (
										<ListGroup.Item key={row}>{row}</ListGroup.Item>
									))}
								</ListGroup>
							</BottomSheet.ScrollView>
							<BottomSheet.Footer sticky>
								<Button>Select all</Button>
							</BottomSheet.Footer>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
				<Text.Caption>
					Scroll the second list to its very end. The last row must clear the footer completely, not sit half behind it
					— that reserve is the footer&apos;s measured height plus the home indicator.
				</Text.Caption>
			</Section>

			<Section title="Check the hand-off">
				<Text.Caption>
					With either list scrolled to the top, drag down: the sheet moves. Scroll down a few rows and drag again: the
					list moves and the sheet stays put. A React Native ScrollView in here would take every drag and the sheet
					would stop responding.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}
