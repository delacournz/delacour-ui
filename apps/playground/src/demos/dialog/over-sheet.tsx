import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Over a bottom sheet",
	caption:
		"A dialog opened from inside a sheet draws above it — the `modal` band sits over every sheet — and Android back closes the dialog before the sheet.",
	align: "center",
	capture: { flow: "dialog/over-sheet", frame: "device" },
};

/** The z-order case: a sheet, and a dialog it opens. */
export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<BottomSheet>
				<BottomSheet.Trigger asChild>
					<Button testID="dialog-sheet-open" variant="outline">
						Open sheet
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Title>Share project</BottomSheet.Title>
							<BottomSheet.Description>Anyone with the link can view.</BottomSheet.Description>
							<Dialog>
								<Dialog.Trigger asChild>
									<Button testID="dialog-sheet-revoke" variant="destructive-soft">
										Revoke link
									</Button>
								</Dialog.Trigger>
								<Dialog.Content size="sm">
									<Dialog.Header>
										<Dialog.Title>Revoke link?</Dialog.Title>
										<Dialog.Description>People using the old link lose access.</Dialog.Description>
									</Dialog.Header>
									<Dialog.Footer>
										<Dialog.Close asChild>
											<Button variant="secondary">Keep</Button>
										</Dialog.Close>
										<Dialog.Close asChild>
											<Button testID="dialog-sheet-confirm" variant="destructive">
												Revoke
											</Button>
										</Dialog.Close>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
