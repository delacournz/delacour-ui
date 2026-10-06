import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An alert dialog",
	caption:
		"`isDismissible={false}`: the scrim takes the touch but does nothing, Android back is ignored, and only the dialog's own action closes it.",
	align: "center",
};

/** A decision the user has to make before going on — there is no way out but the button. */
export function Demo(): ReactElement {
	return (
		<Dialog isDismissible={false}>
			<Dialog.Trigger asChild>
				<Button testID="dialog-alert-open" variant="outline">
					Show terms
				</Button>
			</Dialog.Trigger>
			<Dialog.Content size="sm">
				<Dialog.Header>
					<Dialog.Title>Updated terms</Dialog.Title>
					<Dialog.Description>
						We changed how shared projects are billed. Review and accept the terms to keep working.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Dialog.Close asChild>
						<Button testID="dialog-alert-accept">Accept</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	);
}
