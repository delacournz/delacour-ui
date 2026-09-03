import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import { ListGroup } from "delacour-react-native-ui/list-group";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrolling under a pinned footer",
	note: "Scroll the second list to its very end. The last row must clear the footer completely, not sit half behind it — that reserve is the footer's measured height plus the home indicator.\n\nWith either list scrolled to the top, drag down: the sheet moves. Scroll down a few rows and drag again: the list moves and the sheet stays put. A React Native ScrollView in here would take every drag and the sheet would stop responding.",
};

const SNAP_POINTS = ["55%", "90%"];
const ROWS = Array.from({ length: 24 }, (_, index) => `Row ${index + 1}`);

/** The same list, under a footer lifted out of the tree and handed to gorhom. */
export function Demo(): ReactElement {
	return (
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
	);
}
