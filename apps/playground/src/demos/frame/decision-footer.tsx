import { Button } from "@delacour/react-native-ui/button";
import { Frame } from "@delacour/react-native-ui/frame";
import { Item } from "@delacour/react-native-ui/item";
import { Switch } from "@delacour/react-native-ui/switch";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Decision footer",
	caption:
		'An `inset` frame sets its footer in the band under the tray. `align="stretch"` gives each button an equal share of the row.',
	capture: { align: "stretch", flow: "frame/decision-footer" },
};

export function Demo(): ReactElement {
	const [isArchived, setIsArchived] = useState(true);
	const [isNotified, setIsNotified] = useState(false);
	const [saved, setSaved] = useState(false);

	return (
		<Frame variant="inset">
			<Frame.Header>
				<Frame.Title>Close project</Frame.Title>
				<Frame.Description>{saved ? "Saved." : "Choose what happens to its work."}</Frame.Description>
			</Frame.Header>
			<Frame.Tray>
				<Item>
					<Item.Content>
						<Item.Title>Archive files</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Switch
							accessibilityLabel="Archive files"
							isSelected={isArchived}
							onSelectedChange={setIsArchived}
							testID="switch-archive"
						/>
					</Item.Actions>
				</Item>
				<Item>
					<Item.Content>
						<Item.Title>Notify members</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Switch
							accessibilityLabel="Notify members"
							isSelected={isNotified}
							onSelectedChange={setIsNotified}
							testID="switch-notify"
						/>
					</Item.Actions>
				</Item>
			</Frame.Tray>
			<Frame.Footer align="stretch" testID="frame-footer">
				<Button onPress={() => setSaved(false)} testID="frame-cancel" variant="secondary">
					Cancel
				</Button>
				<Button onPress={() => setSaved(true)} testID="frame-save">
					Save
				</Button>
			</Frame.Footer>
		</Frame>
	);
}
