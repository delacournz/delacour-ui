import { SlideButton } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Slide to ship",
	caption:
		"Drag the handle across the rail to confirm. The handle tracks the finger exactly; a release short of the threshold springs it home, and one past it confirms with a tick.",
	align: "center",
	capture: { flow: "slide-button/slide-to-ship", hero: true },
};

export function Demo(): ReactElement {
	return (
		<SlideButton accessibilityActionLabel="Ship order" autoResetDelay={1500} isAutoReset testID="slide-to-ship">
			<SlideButton.Label>Slide to ship</SlideButton.Label>
			<SlideButton.Thumb testID="slide-to-ship-thumb" />
		</SlideButton>
	);
}
