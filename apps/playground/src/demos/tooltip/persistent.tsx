import { Button } from "@delacour/react-native-ui/button";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Persistent",
	caption: "`duration={0}` keeps the label until the trigger is pressed again or something else is tapped.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Tooltip duration={0} openOn="press">
			<Tooltip.Trigger asChild>
				<Button testID="tooltip-persistent" variant="outline">
					Shortcut
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content placement="bottom">
				<Tooltip.Arrow />
				<Tooltip.Text>Press ⌘K anywhere</Tooltip.Text>
			</Tooltip.Content>
		</Tooltip>
	);
}
