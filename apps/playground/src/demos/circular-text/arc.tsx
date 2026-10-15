import { CircularText } from "@delacour/react-native-ui/circular-text";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMedal } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Arc",
	align: "center",
	caption: "A 140° arc centred on the top, over a mark. Static — the ends stay open.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<CircularText
			centerContent={<Icon icon={IconMedal} size="2xl" />}
			radius={64}
			size="sm"
			span={{ kind: "arc", sweep: 140 }}
		>
			Handmade in Wellington
		</CircularText>
	);
}
