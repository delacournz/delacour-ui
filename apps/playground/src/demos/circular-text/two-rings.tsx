import { CircularText } from "@delacour/react-native-ui/circular-text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Two rings",
	align: "center",
	caption:
		"Rings nest by radius alone, because `radius` names the middle of the type. The outer turns clockwise, the inner counterclockwise and faster.",
};

export function Demo(): ReactElement {
	return (
		<CircularText
			centerContent={
				<CircularText
					direction="counterclockwise"
					radius={48}
					repeat="fill"
					separator=" · "
					size="xs"
					spin={{ kind: "loop", speed: 40 }}
					weight="medium"
				>
					SCROLL DOWN
				</CircularText>
			}
			radius={80}
			repeat="fill"
			spin={{ kind: "loop", speed: 18 }}
		>
			MADE IN AOTEAROA
		</CircularText>
	);
}
