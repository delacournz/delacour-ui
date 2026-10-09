import { Icon } from "@delacour/react-native-ui/icon";
import { IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hold to erase",
	caption:
		"Press and hold. The fill grows from the leading edge and the action fires only when it reaches the end; let go early and it plays back at the same rate.",
	align: "center",
	capture: { flow: "progress-button/hold-to-erase", hero: true },
};

export function Demo(): ReactElement {
	return (
		<ProgressButton className="w-64" isAutoReset testID="hold-to-erase" variant="destructive">
			<Icon icon={IconTrashCan} />
			<ProgressButton.Label>Hold to erase</ProgressButton.Label>
		</ProgressButton>
	);
}
