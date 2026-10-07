import { Button } from "@delacour/react-native-ui/button";
import { Drawer } from "@delacour/react-native-ui/drawer";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconArchive,
	IconBarsThree,
	IconHome,
	IconInboxEmpty,
	IconSettingsGear1,
} from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Navigation menu",
	caption:
		"From the start edge. Every row is a `Drawer.Close asChild`, so choosing a place also shuts the menu. Swipe it back toward the edge, tap the scrim, press ✕ or Android back.",
	align: "center",
	capture: { flow: "drawer/navigation", frame: "device", hero: true },
};

type Place = "home" | "inbox" | "archive" | "settings";

const PLACES: readonly { id: Place; title: string; icon: IconComponent }[] = [
	{ id: "home", title: "Home", icon: IconHome },
	{ id: "inbox", title: "Inbox", icon: IconInboxEmpty },
	{ id: "archive", title: "Archive", icon: IconArchive },
	{ id: "settings", title: "Settings", icon: IconSettingsGear1 },
];

export function Demo(): ReactElement {
	const [place, setPlace] = useState<Place>("home");

	return (
		<View className="grow items-center justify-center">
			<Drawer>
				<Drawer.Trigger asChild>
					<Button testID="drawer-navigation-open" variant="outline">
						<Icon icon={IconBarsThree} />
						<Button.Label>Menu</Button.Label>
					</Button>
				</Drawer.Trigger>
				<Drawer.Content side="start" testID="drawer-navigation-panel">
					<Drawer.Header>
						<Drawer.Title>Harbour Studio</Drawer.Title>
						<Drawer.Description>Signed in as aria@harbour.studio</Drawer.Description>
					</Drawer.Header>
					<Drawer.Body>
						<ListGroup variant="transparent">
							{PLACES.map((entry) => (
								<Drawer.Close asChild key={entry.id}>
									<ListGroup.Item onPress={() => setPlace(entry.id)} testID={`drawer-navigation-${entry.id}`}>
										<ListGroup.ItemPrefix>
											<Icon color={entry.id === place ? "primary" : "muted-foreground"} icon={entry.icon} />
										</ListGroup.ItemPrefix>
										<ListGroup.ItemContent>
											<ListGroup.ItemTitle>{entry.title}</ListGroup.ItemTitle>
										</ListGroup.ItemContent>
									</ListGroup.Item>
								</Drawer.Close>
							))}
						</ListGroup>
					</Drawer.Body>
					<Drawer.Footer>
						<Drawer.Close asChild>
							<Button testID="drawer-navigation-sign-out" variant="secondary">
								Sign out
							</Button>
						</Drawer.Close>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer>
		</View>
	);
}
