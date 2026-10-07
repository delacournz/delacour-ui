import { Button } from "@delacour/react-native-ui/button";
import { Drawer } from "@delacour/react-native-ui/drawer";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, from the bottom",
	caption:
		"The screen owns `isOpen` and opens it with no trigger. Every way out — the swipe, the scrim, back, the footer — reports through `onOpenChange` once, which the counter reads.",
	align: "center",
};

export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [closes, setCloses] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setIsOpen(next);
		if (!next) setCloses((count) => count + 1);
	};

	return (
		<View className="items-center gap-3">
			<Button onPress={() => setIsOpen(true)} testID="drawer-controlled-open">
				Open from the bottom
			</Button>
			<Text.Caption color="muted" testID="drawer-controlled-count">
				{isOpen ? "Open" : "Closed"} · closed {closes} times
			</Text.Caption>
			<Drawer isOpen={isOpen} onOpenChange={handleOpenChange}>
				<Drawer.Content side="bottom" size="sm" testID="drawer-controlled-panel">
					<Drawer.Header>
						<Drawer.Title>Share link</Drawer.Title>
						<Drawer.Description>Anyone with the link can view this project.</Drawer.Description>
					</Drawer.Header>
					<Drawer.Footer>
						<Drawer.Close asChild>
							<Button testID="drawer-controlled-done">Done</Button>
						</Drawer.Close>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer>
		</View>
	);
}
