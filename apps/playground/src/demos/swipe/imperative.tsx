import { Button } from "@delacour/react-native-ui/button";
import { IconArchive, IconCheckmark2 } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe, type SwipeHandle, type SwipeOpenSide } from "@delacour/react-native-ui/swipe";
import { type ReactElement, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Imperative",
	caption: "A ref opens and closes the row from outside, and `onOpenChange` reports the side that settled.",
};

export function Demo(): ReactElement {
	const swipe = useRef<SwipeHandle>(null);
	const [side, setSide] = useState<SwipeOpenSide>(null);

	return (
		<View className="gap-4">
			<ListGroup>
				<Swipe onOpenChange={setSide} ref={swipe} testID="swipe-imperative">
					<Swipe.Start>
						<Swipe.Action color="success" icon={IconCheckmark2} label="Done" onPress={() => {}} />
					</Swipe.Start>
					<Swipe.End>
						<Swipe.Action icon={IconArchive} label="Archive" onPress={() => {}} />
					</Swipe.End>
					<Item>
						<Item.Content>
							<Item.Title>Open: {side ?? "none"}</Item.Title>
						</Item.Content>
					</Item>
				</Swipe>
			</ListGroup>
			<View className="flex-row gap-2">
				<Button onPress={() => swipe.current?.open("start")} size="sm" testID="swipe-open-start" variant="secondary">
					<Button.Label>Open start</Button.Label>
				</Button>
				<Button onPress={() => swipe.current?.open("end")} size="sm" testID="swipe-open-end" variant="secondary">
					<Button.Label>Open end</Button.Label>
				</Button>
				<Button onPress={() => swipe.current?.close()} size="sm" testID="swipe-close" variant="secondary">
					<Button.Label>Close</Button.Label>
				</Button>
			</View>
		</View>
	);
}
