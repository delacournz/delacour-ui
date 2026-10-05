import { Button } from "@delacour/react-native-ui/button";
import { Menu } from "@delacour/react-native-ui/menu";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Checkbox and radio rows",
	caption:
		'Checkbox rows stay open, because several are usually toggled in one visit. A radio row closes: a choice made is a visit finished. `indicator="dot"` marks the choice with a dot instead of a tick.',
	align: "center",
};

export function Demo(): ReactElement {
	const [showDone, setShowDone] = useState(true);
	const [showArchived, setShowArchived] = useState(false);
	const [density, setDensity] = useState("comfortable");

	return (
		<Menu>
			<Menu.Trigger asChild>
				<Button testID="menu-view-trigger" variant="outline">
					View
				</Button>
			</Menu.Trigger>
			<Menu.Content>
				<Menu.Label isInset>Show</Menu.Label>
				<Menu.CheckboxItem isChecked={showDone} onCheckedChange={setShowDone} testID="menu-view-done">
					Completed
				</Menu.CheckboxItem>
				<Menu.CheckboxItem isChecked={showArchived} onCheckedChange={setShowArchived}>
					Archived
				</Menu.CheckboxItem>
				<Menu.Separator />
				<Menu.Label isInset>Density</Menu.Label>
				<Menu.RadioGroup onValueChange={setDensity} value={density}>
					<Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
					<Menu.RadioItem indicator="dot" value="compact">
						Compact
					</Menu.RadioItem>
				</Menu.RadioGroup>
			</Menu.Content>
		</Menu>
	);
}
