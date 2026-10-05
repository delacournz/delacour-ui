import { Icon } from "@delacour/react-native-ui/icon";
import { IconCreditCard1, IconLock } from "@delacour/react-native-ui/icons/central";
import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom done",
	caption:
		"Write a `ProgressButton.Done` to replace the default tick. A bare `Icon` and a `ProgressButton.Label` inside it take the fill's foreground.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<ProgressButton className="w-64" isAutoReset size="lg" testID="custom-done" variant="success">
			<Icon icon={IconCreditCard1} />
			<ProgressButton.Label>Hold to pay</ProgressButton.Label>
			<ProgressButton.Done>
				<Icon icon={IconLock} />
				<ProgressButton.Label>Paid</ProgressButton.Label>
			</ProgressButton.Done>
		</ProgressButton>
	);
}
