import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Auto reset",
	caption:
		"`isAutoReset` rewinds the button by itself after `autoResetDelay`. The fill travels back rather than snapping to empty.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<ProgressButton autoResetDelay={1500} className="w-64" holdDuration={1200} isAutoReset testID="auto-reset">
			Hold to check in
		</ProgressButton>
	);
}
