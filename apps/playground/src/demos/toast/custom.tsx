import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPeople } from "@delacour/react-native-ui/icons/central";
import { Toast, toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom",
	caption:
		"`render` draws the card. Compose `<Toast>` to keep the look — it hides the toast it is drawn in with no `onHide` of its own.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Button
			onPress={() =>
				toast.show({
					placement: "top",
					render: () => (
						<Toast status="info">
							<Toast.Indicator>
								<Icon icon={IconPeople} />
							</Toast.Indicator>
							<Toast.Content>
								<Toast.Title>Priya joined “Harbour Bridge”</Toast.Title>
								<Toast.Description>She can edit every file in the project.</Toast.Description>
							</Toast.Content>
							<Toast.Close testID="toast-custom-close" />
						</Toast>
					),
				})
			}
			testID="toast-custom"
			variant="outline"
		>
			Invite Priya
		</Button>
	);
}
