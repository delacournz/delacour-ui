import { Button } from "@delacour/react-native-ui/button";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Surface",
	caption: '`variant="surface"` draws the popover card instead of the inverted chip, with room for a title and a line.',
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Tooltip label="Changes reach your other devices within a minute" openOn="press">
			<Tooltip.Trigger asChild>
				<Button testID="tooltip-surface" variant="secondary">
					Sync now
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content className="max-w-64" variant="surface">
				<Tooltip.Arrow />
				<Tooltip.Title>Sync</Tooltip.Title>
				<Tooltip.Description>Changes reach your other devices within a minute.</Tooltip.Description>
			</Tooltip.Content>
		</Tooltip>
	);
}
