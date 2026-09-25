import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconFileText, IconMoon, IconSparkle } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Switch } from "@delacour/react-native-ui/switch";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controls in the actions",
	caption: "A static item leaves its actions as the controls — a controlled switch, an uncontrolled one, and a button.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isDark, setIsDark] = useState(false);
	const [downloads, setDownloads] = useState(0);

	return (
		<Item.Group>
			<Item variant="muted">
				<Item.Media>
					<Icon icon={IconMoon} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Dark mode</Item.Title>
					<Item.Description>{isDark ? "Controlled — on" : "Controlled — off"}</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Switch
						accessibilityLabel="Dark mode"
						isSelected={isDark}
						onSelectedChange={setIsDark}
						testID="switch-dark"
					/>
				</Item.Actions>
			</Item>
			<Item variant="muted">
				<Item.Media>
					<Icon icon={IconSparkle} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Suggestions</Item.Title>
					<Item.Description>Uncontrolled — holds its own state</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Switch accessibilityLabel="Suggestions" defaultSelected testID="switch-suggestions" />
				</Item.Actions>
			</Item>
			<Item variant="muted">
				<Item.Media variant="icon">
					<Icon icon={IconFileText} />
				</Item.Media>
				<Item.Content>
					<Item.Title numberOfLines={1}>Invoice.pdf</Item.Title>
					<Item.Description>{downloads === 0 ? "2.4 MB" : `2.4 MB · opened ${downloads}×`}</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Button onPress={() => setDownloads((count) => count + 1)} size="sm" testID="button-open" variant="outline">
						<Button.Label>Open</Button.Label>
					</Button>
				</Item.Actions>
			</Item>
		</Item.Group>
	);
}
