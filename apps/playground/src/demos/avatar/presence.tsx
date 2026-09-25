import { Avatar, type AvatarColor } from "@delacour/react-native-ui/avatar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Presence",
	align: "center",
	caption:
		"An empty `Avatar.Badge` is a presence dot, ringed in the page background. Tap the avatar to cycle its status; the status is part of the avatar's own label, because the dot has no words.",
	capture: {},
};

const STATUSES = ["online", "away", "busy", "offline"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLOR: Record<Status, AvatarColor> = {
	online: "success",
	away: "warning",
	busy: "destructive",
	offline: "default",
};

const STATUS_LABEL: Record<Status, string> = {
	online: "Online",
	away: "Away",
	busy: "Busy",
	offline: "Offline",
};

export function Demo(): ReactElement {
	const [status, setStatus] = useState<Status>("online");
	const next = () => setStatus((current) => STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length] ?? "online");

	return (
		<View className="items-center gap-3">
			<Avatar
				accessibilityLabel={`Kate Austen, ${STATUS_LABEL[status]}`}
				haptic="selection"
				name="Kate Austen"
				onPress={next}
				size="xl"
				source={{ uri: "https://i.pravatar.cc/160?img=47" }}
				testID="avatar-presence"
			>
				<Avatar.Badge color={STATUS_COLOR[status]} placement="bottom-right" />
			</Avatar>
			<Text.Caption color="muted" testID="presence-status">
				{STATUS_LABEL[status]}
			</Text.Caption>
		</View>
	);
}
