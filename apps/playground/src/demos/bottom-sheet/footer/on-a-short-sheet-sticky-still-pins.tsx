import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "On a short sheet, sticky still pins",
	note: "Compare the last two against the home indicator. The pinned footer's surface should run to the bottom of the sheet with the buttons above the indicator, never behind it.",
};

/** A dynamically sized sheet whose content reserves the pinned footer's height. */
export function Demo(): ReactElement {
	return (
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
							The content reserves the footer's height, so the two do not overlap even here.
						</BottomSheet.Description>
					</BottomSheet.Content>
					<BottomSheet.Footer sticky>
						<Button>Done</Button>
					</BottomSheet.Footer>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
