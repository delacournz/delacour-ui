import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconEditSmall1 } from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A pushed screen",
	caption:
		"The leading slot, the trailing `actions` and the sticky footer, on the screen a row was tapped to reach. The title and subtitle stack inside the back control so the whole block shares its tap target, and `min-w-0 flex-1` truncates a long name to one line rather than pushing the actions off the right edge.",
	capture: { frame: "device" },
};

const NOTES = [
	"Called about the analytical engine. Wants the notes on Bernoulli numbers by Thursday.",
	"Prefers a written summary to a call. Reachable in the afternoon, London time.",
];

/**
 * Two screens and the control that moves between them.
 *
 * `Screen.Navbar.BackButton` takes an `onPress` rather than calling a router
 * itself — the library has no navigation dependency — so here it swaps a piece
 * of local state instead. In an app that handler is `() => router.back()`.
 *
 * It opens on the pushed screen so the back control has somewhere to go.
 */
export function Demo(): ReactElement {
	const [isPushed, setPushed] = useState(true);

	if (!isPushed) {
		return (
			<Screen>
				<Screen.Navbar>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Contacts</Screen.Navbar.Title>
					</View>
				</Screen.Navbar>

				<Screen.ScrollArea>
					<ListGroup>
						<ListGroup.Item onPress={() => setPushed(true)} testID="row-ada">
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Ada Lovelace</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>+64 21 555 0142</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					</ListGroup>
				</Screen.ScrollArea>
			</Screen>
		);
	}

	return (
		<Screen>
			<Screen.Navbar
				actions={
					<Button accessibilityLabel="Edit" size="icon-sm" variant="secondary">
						<Icon icon={IconEditSmall1} />
					</Button>
				}
				placement="static"
			>
				<Screen.Navbar.BackButton onPress={() => setPushed(false)} testID="back">
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Ada Lovelace</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>+64 21 555 0142</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-4">
				{NOTES.map((note) => (
					<Text className="text-foreground" key={note}>
						{note}
					</Text>
				))}
			</Screen.ScrollArea>

			<Screen.Footer sticky>
				<Button haptic="medium" onPress={() => setPushed(false)} testID="done">
					Done
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
