import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMagnifyingGlass, IconSettingsGear1 } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A navbar, a body and a footer",
	caption:
		"The whole composition, and the only one most screens need. Nothing here names a safe-area inset or a navbar height — each part measures itself into the screen context and the scroll area reserves exactly that, so the first row clears the bar and the last one clears the footer.",
	capture: { frame: "device", hero: true },
};

const MESSAGES = [
	{ id: "ada", title: "Ada Lovelace", description: "The analytical engine has no pretensions" },
	{ id: "grace", title: "Grace Hopper", description: "It is easier to ask forgiveness than permission" },
	{ id: "alan", title: "Alan Turing", description: "We can only see a short distance ahead" },
	{ id: "katherine", title: "Katherine Johnson", description: "Numbers checked, ready when you are" },
	{ id: "margaret", title: "Margaret Hamilton", description: "The rope core memory is loaded" },
	{ id: "barbara", title: "Barbara Liskov", description: "A subtype should be substitutable" },
] as const;

/**
 * A root screen: an overlay navbar, a scrolling body and a footer.
 *
 * There is no back control because a root screen has nowhere to go back to —
 * `Screen.Navbar.BackButton` takes an `onPress` and this library wires no
 * router of its own, so the navigation is the app's to supply.
 *
 * The footer is the part worth watching: it measures its own content into the
 * screen context, and the scroll area reserves that height, so the last row
 * clears it with nothing said at either call site.
 */
export function Demo(): ReactElement {
	const [readIds, setReadIds] = useState<string[]>([]);

	const unread = MESSAGES.length - readIds.length;

	function markRead(id: string): void {
		setReadIds((current) => (current.includes(id) ? current : [...current, id]));
	}

	return (
		<Screen>
			<Screen.Navbar
				actions={
					<>
						<Button accessibilityLabel="Search" size="icon-sm" variant="secondary">
							<Icon icon={IconMagnifyingGlass} />
						</Button>
						<Button accessibilityLabel="Settings" size="icon-sm" variant="secondary">
							<Icon icon={IconSettingsGear1} />
						</Button>
					</>
				}
			>
				<View className="min-w-0 flex-1">
					<Screen.Navbar.Title>Inbox</Screen.Navbar.Title>
					<Screen.Navbar.Subtitle>{unread === 0 ? "All caught up" : `${unread} unread`}</Screen.Navbar.Subtitle>
				</View>
			</Screen.Navbar>

			<Screen.ScrollArea>
				<ListGroup>
					{MESSAGES.map((message) => (
						<ListGroup.Item key={message.id} onPress={() => markRead(message.id)} testID={`row-${message.id}`}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{message.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{readIds.includes(message.id) ? "Read" : message.description}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>
			</Screen.ScrollArea>

			<Screen.Footer>
				<Button
					haptic="medium"
					isDisabled={unread === 0}
					onPress={() => setReadIds(MESSAGES.map((message) => message.id))}
					testID="mark-all-read"
				>
					Mark all as read
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
