import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import { toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Over a dialog",
	caption:
		"Toasts draw in the overlay z-order's top band, so one shown from a dialog sits above its scrim — and the dialog under it stays usable.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Dialog>
			<Dialog.Trigger asChild>
				<Button testID="toast-dialog-open" variant="outline">
					Share project
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Close testID="toast-dialog-close" />
				<Dialog.Header>
					<Dialog.Title>Share “Harbour Bridge”</Dialog.Title>
					<Dialog.Description>Anyone with the link can view the project.</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button onPress={() => toast("Link copied")} testID="toast-dialog-copy" variant="secondary">
						Copy link
					</Button>
					<Dialog.Close asChild>
						<Button>Done</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	);
}
