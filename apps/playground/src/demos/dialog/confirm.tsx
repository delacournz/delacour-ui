import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Confirm a destructive action",
	caption:
		"A trigger that donates its press to a `Button`, a title, a description and two actions. The scrim, the ✕, Cancel and Android back all close it.",
	align: "center",
	capture: { flow: "dialog/confirm", frame: "device", hero: true },
};

/** The whole composition: the question, what it costs, and the two answers. */
export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<Dialog>
				<Dialog.Trigger asChild>
					<Button testID="dialog-confirm-open" variant="destructive">
						Delete project
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Close testID="dialog-confirm-close" />
					<Dialog.Header>
						<Dialog.Title>Delete project?</Dialog.Title>
						<Dialog.Description>
							“Harbour Bridge” and its 24 files will be removed for everyone. This cannot be undone.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close asChild>
							<Button testID="dialog-confirm-cancel" variant="secondary">
								Cancel
							</Button>
						</Dialog.Close>
						<Dialog.Close asChild>
							<Button testID="dialog-confirm-delete" variant="destructive">
								Delete
							</Button>
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog>
		</View>
	);
}
