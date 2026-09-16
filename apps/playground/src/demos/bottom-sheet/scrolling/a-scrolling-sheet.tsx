import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A scrolling sheet",
};

const SNAP_POINTS = ["55%", "90%"];
const ROWS = Array.from({ length: 24 }, (_, index) => `Row ${index + 1}`);

/**
 * A body taller than the sheet.
 *
 * `BottomSheet.ScrollView` is gorhom's scrollable rather than a React Native
 * one, which is what lets the sheet and the list negotiate a single drag.
 */
export function Demo(): ReactElement {
	return (
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
	);
}
