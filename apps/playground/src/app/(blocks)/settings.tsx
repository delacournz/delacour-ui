import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconBell,
	IconCreditCard1,
	IconDoor,
	IconEmail1,
	IconGlobe,
	IconLock,
	IconShieldCheck,
} from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { BlockScreen } from "@/components/block-screen";
import { BlockSection } from "@/components/block-section";

type ToggleId = "push" | "email" | "twoFactor";

const TOGGLES: readonly { id: ToggleId; title: string; description: string; icon: IconComponent }[] = [
	{ id: "push", title: "Push notifications", description: "Mentions and replies", icon: IconBell },
	{ id: "email", title: "Email digest", description: "A summary every Monday", icon: IconEmail1 },
	{ id: "twoFactor", title: "Two-step sign-in", description: "A code on every new device", icon: IconShieldCheck },
];

/**
 * Settings: a profile, switches, navigation rows and a sign-out, each a kicker over a tray.
 *
 * The switch rows are static `Item`s with the `Switch` in their actions, because a
 * pressable row must not hold another control. The navigation rows are
 * `ListGroup.Item`s with the default chevron, and the value they show sits in the
 * suffix beside it.
 */
export default function SettingsBlock(): ReactElement {
	const [enabled, setEnabled] = useState<Record<ToggleId, boolean>>({ push: true, email: false, twoFactor: true });

	return (
		<BlockScreen subtitle="Block" title="Settings">
			<BlockSection kicker="Account">
				<ListGroup className="rounded-xl">
					<ListGroup.Item haptic="selection">
						<ListGroup.ItemPrefix>
							<Avatar name="Rawiri Kemp" size="md" />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Rawiri Kemp</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>rawiri@delacour.co.nz</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			</BlockSection>

			<BlockSection footnote="Changes apply to every device signed in to this account." kicker="Notifications">
				<ListGroup className="rounded-xl">
					{TOGGLES.map((toggle) => (
						<Item key={toggle.id}>
							<Item.Media>
								<Icon icon={toggle.icon} />
							</Item.Media>
							<Item.Content>
								<Item.Title>{toggle.title}</Item.Title>
								<Item.Description>{toggle.description}</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Switch
									accessibilityLabel={toggle.title}
									isSelected={enabled[toggle.id]}
									onSelectedChange={(next) => setEnabled((current) => ({ ...current, [toggle.id]: next }))}
									testID={`settings-${toggle.id}`}
								/>
							</Item.Actions>
						</Item>
					))}
				</ListGroup>
			</BlockSection>

			<BlockSection kicker="Preferences">
				<ListGroup className="rounded-xl">
					<ListGroup.Item haptic="selection">
						<ListGroup.ItemPrefix>
							<Icon icon={IconGlobe} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Language</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Text.Caption color="muted">English (NZ)</Text.Caption>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
					<ListGroup.Item haptic="selection">
						<ListGroup.ItemPrefix>
							<Icon icon={IconLock} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Password</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<ListGroup.Item haptic="selection">
						<ListGroup.ItemPrefix>
							<Icon icon={IconCreditCard1} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Billing</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Text.Caption color="muted">Pro</Text.Caption>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ListGroup>
			</BlockSection>

			<View>
				<Button material="etched" size="md" variant="outline">
					<Icon icon={IconDoor} />
					<Button.Label>Sign out</Button.Label>
				</Button>
			</View>
		</BlockScreen>
	);
}
