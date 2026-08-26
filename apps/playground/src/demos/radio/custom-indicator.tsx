import { Icon } from "@delacour/native-ui/icon";
import { IconCheckmark1Small } from "@delacour/native-ui/icons/central";
import { Radio } from "@delacour/native-ui/radio";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom indicator",
	note: "Writing the indicator out by hand suppresses the automatic one, which is what puts a ring at the end of the row.",
};

export function Demo(): ReactElement {
	return (
		<Radio.Group accessibilityLabel="Custom indicator" defaultSelected="a">
			<Radio testID="radio-custom" value="a">
				<Radio.Indicator className="border-success">
					{({ isSelected }) => <Icon color={isSelected ? "success" : "muted-foreground"} icon={IconCheckmark1Small} />}
				</Radio.Indicator>
				<Radio.Label>Children replace the dot</Radio.Label>
			</Radio>
			<Radio testID="radio-trailing" value="b">
				<Radio.Label>Trailing ring</Radio.Label>
				<Radio.Indicator />
			</Radio>
		</Radio.Group>
	);
}
