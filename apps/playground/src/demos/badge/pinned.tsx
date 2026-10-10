import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconEmail1 } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pinned to a corner",
	align: "center",
	note: "`placement` pins the badge by its inner edge, so a count that gains a digit grows away from the glyph. `Badge.Anchor` sizes the pair to the glyph.",
	capture: {},
};

export function Demo(): ReactElement {
	const [unread, setUnread] = useState(3);

	return (
		<View className="items-center gap-6">
			<View className="flex-row items-center gap-8">
				<Badge.Anchor accessibilityLabel="Notifications, new activity" accessible testID="pinned-dot">
					<Icon icon={IconBell} size="lg" />
					<Badge color="destructive" placement="top-right" />
				</Badge.Anchor>
				<Badge.Anchor
					accessibilityLabel={unread > 0 ? `Inbox, ${unread} unread` : "Inbox"}
					accessible
					testID="pinned-count"
				>
					<Icon icon={IconEmail1} size="lg" />
					<Badge color="destructive" count={unread} placement="top-right" size="sm" />
				</Badge.Anchor>
				<Badge.Anchor accessibilityLabel="Inbox, 128 unread" accessible testID="pinned-overflow">
					<Icon icon={IconEmail1} size="lg" />
					<Badge color="destructive" count={128} placement="top-right" size="sm" />
				</Badge.Anchor>
				<Badge.Anchor accessibilityLabel="Notifications, online" accessible testID="pinned-bottom">
					<Icon icon={IconBell} size="lg" />
					<Badge color="success" placement="bottom-right" />
				</Badge.Anchor>
			</View>
			<View className="flex-row gap-2">
				<Button onPress={() => setUnread((count) => count + 4)} size="sm" testID="pinned-add" variant="secondary">
					New mail
				</Button>
				<Button isDisabled={unread === 0} onPress={() => setUnread(0)} size="sm" testID="pinned-clear" variant="ghost">
					Mark read
				</Button>
			</View>
		</View>
	);
}
