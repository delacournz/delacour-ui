import { Badge } from "@delacour/react-native-ui/badge";
import { Popover } from "@delacour/react-native-ui/popover";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Arrow",
	caption:
		"`Popover.Arrow` points at the trigger's centre, not the panel's — with `align=\"start\"` the panel runs to the right and the arrow stays on the badge.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Popover>
			<Popover.Trigger accessibilityLabel="Beta, what does this mean?" testID="open-popover">
				<Badge variant="soft">Beta</Badge>
			</Popover.Trigger>
			<Popover.Content align="start" className="max-w-64">
				<Popover.Arrow />
				<Popover.Title>Beta</Popover.Title>
				<Popover.Description>This feature is still changing. Tell us what breaks.</Popover.Description>
			</Popover.Content>
		</Popover>
	);
}
