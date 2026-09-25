import { Avatar } from "@delacour/react-native-ui/avatar";
import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Unread count",
	align: "center",
	caption:
		"Given children, `Avatar.Badge` only pins them — a `Badge` keeps the look it has everywhere else, and hangs over the edge of the circle without being clipped.",
	capture: {},
};

export function Demo(): ReactElement {
	const [unread, setUnread] = useState(3);

	return (
		<View className="items-center gap-4">
			<Avatar
				accessibilityLabel={unread > 0 ? `Oliver Lee, ${unread} unread` : "Oliver Lee"}
				name="Oliver Lee"
				size="lg"
				source={{ uri: "https://i.pravatar.cc/160?img=12" }}
				testID="avatar-unread"
			>
				{unread > 0 ? (
					<Avatar.Badge>
						<Badge color="destructive" size="sm">
							{unread > 99 ? "99+" : unread}
						</Badge>
					</Avatar.Badge>
				) : null}
			</Avatar>
			<View className="flex-row gap-2">
				<Button onPress={() => setUnread((count) => count + 1)} size="sm" testID="unread-add" variant="secondary">
					New message
				</Button>
				<Button isDisabled={unread === 0} onPress={() => setUnread(0)} size="sm" testID="unread-clear" variant="ghost">
					Mark read
				</Button>
			</View>
		</View>
	);
}
