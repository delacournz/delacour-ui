import { Button } from "delacour-react-native-ui/button";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group with an input",
	caption:
		"A field joins the run like any other member. Joined, it takes the group's corner rather than its own, so both ends of the row draw the same arc.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="w-full gap-4">
			<Button.Group className="w-full" testID="search">
				<Input className="flex-1" placeholder="Search components" testID="search-field" variant="secondary" />
				<Button testID="search-submit">Search</Button>
			</Button.Group>
			<Button.Group className="w-full" size="sm" testID="invite" variant="outline">
				<Input className="flex-1" placeholder="name@example.com" testID="invite-field" variant="secondary" />
				<Button testID="invite-send">Invite</Button>
			</Button.Group>
		</View>
	);
}
