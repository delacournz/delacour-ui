import { SlideButton } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "`isDisabled` fades the control and refuses the drag outright — the handle does not move at all.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<SlideButton isDisabled testID="disabled">
			<SlideButton.Label>Slide to ship</SlideButton.Label>
		</SlideButton>
	);
}
