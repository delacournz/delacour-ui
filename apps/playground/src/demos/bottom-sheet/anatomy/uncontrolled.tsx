import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Uncontrolled",
	note: "Open the first sheet and dismiss it four different ways. The counter under it counts every one, because `onOpenChange` is the only callback there is.",
};

/** No `isOpen` anywhere — the sheet holds its own state. */
export function Demo(): ReactElement {
	return (
		<BottomSheet>
			<BottomSheet.Trigger asChild>
				<Button variant="ghost">No isOpen anywhere</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Title>The sheet holds its own state</BottomSheet.Title>
						<BottomSheet.Description>Nothing on this screen knows whether it is open.</BottomSheet.Description>
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
