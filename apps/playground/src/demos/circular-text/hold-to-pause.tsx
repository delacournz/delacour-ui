import { CircularText } from "@delacour/react-native-ui/circular-text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hold to pause",
	align: "center",
	caption:
		'`pause={{ kind: "press" }}` eases the ring to a halt while a finger is down and back up to speed on release, from the same angle — no snap.',
	capture: { flow: "circular-text/hold-to-pause" },
};

export function Demo(): ReactElement {
	return (
		<CircularText
			pause={{ kind: "press" }}
			radius={72}
			repeat="fill"
			size="sm"
			spin={{ kind: "loop", speed: 48 }}
			testID="circular-text-hold"
		>
			PRESS AND HOLD
		</CircularText>
	);
}
