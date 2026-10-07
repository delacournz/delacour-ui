import { Button } from "@delacour/react-native-ui/button";
import { Input } from "@delacour/react-native-ui/input";
import { Popover } from "@delacour/react-native-ui/popover";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Trigger width, with a field",
	caption:
		'`width="trigger"` makes the panel as wide as the button, raised to `minWidth`. Focus the field: the keyboard counts as the bottom of the screen, so the panel moves above the trigger if it has to.',
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [name, setName] = useState("Quarterly report");
	const [draft, setDraft] = useState(name);
	const [isOpen, setOpen] = useState(false);

	const open = (next: boolean) => {
		if (next) setDraft(name);
		setOpen(next);
	};

	return (
		<Popover isOpen={isOpen} onOpenChange={open}>
			<Popover.Trigger asChild>
				<Button className="self-stretch" testID="open-popover" variant="secondary">
					{name}
				</Button>
			</Popover.Trigger>
			<Popover.Content align="start" minWidth={260} width="trigger">
				<Popover.Arrow />
				<Popover.Title>Rename</Popover.Title>
				<Input autoFocus onChangeText={setDraft} selectTextOnFocus testID="rename-input" value={draft} />
				<View className="flex-row justify-end gap-2">
					<Popover.Close asChild>
						<Button size="sm" variant="ghost">
							Cancel
						</Button>
					</Popover.Close>
					<Button
						onPress={() => {
							setName(draft.trim() || name);
							setOpen(false);
						}}
						size="sm"
						testID="rename-save"
					>
						Save
					</Button>
				</View>
			</Popover.Content>
		</Popover>
	);
}
