import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A scrim that does not dismiss",
};

/** `isCloseOnPress={false}` leaves the scrim inert, for a sheet that must be answered. */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="outline">Open</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay isCloseOnPress={false} />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Title>Confirm first</BottomSheet.Title>
						<BottomSheet.Description>
							Pressing the scrim does nothing here. Swipe down, or use the button.
						</BottomSheet.Description>
						<BottomSheet.Close />
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
