import { SlideButton } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Auto reset",
	caption:
		"`isAutoReset` takes the handle home on its own, `autoResetDelay` after it confirms — for an action that repeats.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<SlideButton autoResetDelay={800} haptic="selection" isAutoReset testID="auto-reset">
			<SlideButton.Label>Slide to clock in</SlideButton.Label>
		</SlideButton>
	);
}
