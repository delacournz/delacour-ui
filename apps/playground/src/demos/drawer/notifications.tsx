import { Button } from "@delacour/react-native-ui/button";
import { Drawer } from "@delacour/react-native-ui/drawer";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Notifications tray",
	caption:
		"From the top edge, at `sm`: the panel clears the status bar and rounds only the corners facing the app. Swipe it up to dismiss.",
	align: "center",
	capture: { flow: "drawer/notifications", frame: "device" },
};

const NOTIFICATIONS: readonly { id: string; title: string; description: string }[] = [
	{ id: "invite", title: "Mihi invited you", description: "“Harbour Bridge” · 2 min ago" },
	{ id: "comment", title: "New comment on Plans", description: "“Looks good to me” · 1 h ago" },
	{ id: "export", title: "Export finished", description: "harbour-bridge.pdf · Yesterday" },
];

export function Demo(): ReactElement {
	return (
		<View className="grow items-center justify-center">
			<Drawer>
				<Drawer.Trigger asChild>
					<Button testID="drawer-notifications-open" variant="outline">
						<Icon icon={IconBell} />
						<Button.Label>Notifications</Button.Label>
					</Button>
				</Drawer.Trigger>
				<Drawer.Content side="top" size="sm" testID="drawer-notifications-panel">
					<Drawer.Header>
						<Drawer.Title>Notifications</Drawer.Title>
					</Drawer.Header>
					<Drawer.Body isScrollable={false}>
						<ListGroup variant="secondary">
							{NOTIFICATIONS.map((notification) => (
								<ListGroup.Item key={notification.id} testID={`drawer-notifications-${notification.id}`}>
									<ListGroup.ItemContent>
										<ListGroup.ItemTitle>{notification.title}</ListGroup.ItemTitle>
										<ListGroup.ItemDescription>{notification.description}</ListGroup.ItemDescription>
									</ListGroup.ItemContent>
								</ListGroup.Item>
							))}
						</ListGroup>
					</Drawer.Body>
				</Drawer.Content>
			</Drawer>
		</View>
	);
}
