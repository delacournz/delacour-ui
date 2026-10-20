import { CircularText } from "@delacour/react-native-ui/circular-text";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Seal",
	align: "center",
	caption:
		'A phrase repeated to close the ring, turning at 24° a second around an icon that stays upright. `repeat="fill"` estimates the copies; `textLength` absorbs the error as spacing.',
	capture: { flow: true, hero: true },
};

export function Demo(): ReactElement {
	return (
		<CircularText
			centerContent={<Icon icon={IconStar} size="xl" />}
			radius={72}
			repeat="fill"
			spin={{ kind: "loop" }}
			testID="circular-text-seal"
		>
			DELACOUR UI
		</CircularText>
	);
}
