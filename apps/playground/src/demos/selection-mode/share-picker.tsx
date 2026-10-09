import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode, useSelectionMode } from "@delacour/react-native-ui/selection-mode";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Share picker",
	caption:
		"An always-on picker: the mode is held on and the marks show from the start, so a tap picks. `useSelectionMode()` reads the count for the button underneath.",
	capture: { align: "stretch", flow: "selection-mode/share-picker" },
};

const PEOPLE = [
	{ id: "aria", name: "Aria Whitlock", role: "Owner" },
	{ id: "rawiri", name: "Rawiri Kemp", role: "Editor" },
	{ id: "kenji", name: "Kenji Moriyama", role: "Editor" },
	{ id: "lena", name: "Lena Varga", role: "Viewer" },
] as const;

/** Reads the selection from inside the root, which is where the hook has to live. */
function ShareButton(): ReactElement {
	const { count } = useSelectionMode();
	return (
		<Button isDisabled={count === 0} testID="share-button">
			{count === 0 ? "Pick someone" : `Share with ${count}`}
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<SelectionMode className="flex-none gap-4" defaultSelected={["rawiri"]} haptic="selection" isActive>
			<SelectionMode.Group label="Share with">
				{PEOPLE.map((person) => (
					<SelectionMode.Item isIndicatorAlwaysShown key={person.id} testID={`person-${person.id}`} value={person.id}>
						<Item>
							<Item.Media>
								<Avatar accessibilityElementsHidden name={person.name} size="sm" />
							</Item.Media>
							<Item.Content>
								<Item.Title>{person.name}</Item.Title>
								<Item.Description>{person.role}</Item.Description>
							</Item.Content>
						</Item>
					</SelectionMode.Item>
				))}
			</SelectionMode.Group>
			<ShareButton />
		</SelectionMode>
	);
}
