import { Button } from "@delacour/react-native-ui/button";
import { Popover } from "@delacour/react-native-ui/popover";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption: "Tap the button. The panel opens below it, pointing back at it; tap anywhere outside to close it.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Popover>
			<Popover.Trigger asChild>
				<Button testID="open-popover" variant="secondary">
					What changed?
				</Button>
			</Popover.Trigger>
			<Popover.Content className="max-w-72">
				<Popover.Arrow />
				<Popover.Close testID="close-popover" />
				<Popover.Title>Version 2.4</Popover.Title>
				<Popover.Description>Faster sync, offline drafts and a new share sheet.</Popover.Description>
				<Text.Caption>Released 3 October.</Text.Caption>
			</Popover.Content>
		</Popover>
	);
}
