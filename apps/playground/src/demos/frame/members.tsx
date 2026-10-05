import { Avatar } from "@delacour/react-native-ui/avatar";
import { Frame } from "@delacour/react-native-ui/frame";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconChevronRight } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Members",
	caption: "A member list: avatar rows with a role and a chevron, and an invite link in the header.",
	capture: { align: "stretch" },
};

const MEMBERS = [
	{ name: "Aroha Ngata", role: "Owner" },
	{ name: "Oliver Lee", role: "Editor" },
	{ name: "Mere Tamati", role: "Viewer" },
] as const;

export function Demo(): ReactElement {
	return (
		<Frame>
			<Frame.Header>
				<Frame.Title>Members</Frame.Title>
				<Frame.Action accessibilityRole="link" onPress={() => {}}>
					Invite
				</Frame.Action>
			</Frame.Header>
			<Frame.Tray>
				{MEMBERS.map((member) => (
					<Item key={member.name} onPress={() => {}}>
						<Item.Media>
							<Avatar name={member.name} size="sm" />
						</Item.Media>
						<Item.Content>
							<Item.Title>{member.name}</Item.Title>
							<Item.Description>{member.role}</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Icon icon={IconChevronRight} />
						</Item.Actions>
					</Item>
				))}
			</Frame.Tray>
			<Frame.Footer align="start">
				<Text.Caption>3 of 5 seats used</Text.Caption>
			</Frame.Footer>
		</Frame>
	);
}
