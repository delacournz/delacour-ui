import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A scrolling sheet",
};

const SNAP_POINTS = ["55%", "90%"] as const;
const ROWS = Array.from({ length: 24 }, (_, index) => `Row ${index + 1}`);

/**
 * A body taller than the sheet.
 *
 * `BottomSheet.ScrollView` is the engine's scrollable rather than a React Native
 * one, which is what lets the sheet and the list share a single drag.
 */
export function Demo(): ReactElement {
	return (
		<BottomSheet dynamicSizing={false} snapPoints={SNAP_POINTS}>
			<BottomSheet.Trigger asChild>
				<Button variant="secondary">Open a long list</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
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
