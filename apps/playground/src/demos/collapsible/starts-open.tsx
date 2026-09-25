import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Starts open",
	caption:
		"`defaultOpen` sets where an uncontrolled collapsible begins. It paints open on the first frame rather than animating itself open, and closes like any other.",
};

export function Demo(): ReactElement {
	return (
		<Collapsible defaultOpen>
			<Collapsible.Trigger testID="starts-open">
				<Collapsible.Title>Release notes</Collapsible.Title>
				<Collapsible.Description>Version 2.4</Collapsible.Description>
			</Collapsible.Trigger>
			<Collapsible.Content>
				<Text.Paragraph>Faster sync on large libraries, and offline edits now survive a restart.</Text.Paragraph>
			</Collapsible.Content>
		</Collapsible>
	);
}
