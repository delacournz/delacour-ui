import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Explicit snap points",
};

const SNAP_POINTS = ["35%", "70%"];

/** For a sheet whose height is a decision rather than a measurement. */
export function Demo(): ReactElement {
	return (
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
	);
}
