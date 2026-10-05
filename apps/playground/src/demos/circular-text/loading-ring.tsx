import { CircularText } from "@delacour/react-native-ui/circular-text";
import { Spinner } from "@delacour/react-native-ui/spinner";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading ring",
	align: "center",
	caption:
		"A ring doubling as the label for a long wait, with a `Spinner` in the middle. A screen reader hears the phrase once, separators stripped.",
};

export function Demo(): ReactElement {
	return (
		<CircularText
			centerContent={<Spinner size="lg" />}
			color="muted"
			radius={44}
			repeat="fill"
			separator=" · "
			spin={{ kind: "loop", speed: 60 }}
			weight="medium"
		>
			UPLOADING
		</CircularText>
	);
}
