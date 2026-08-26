import { Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconBell, IconUser } from "@delacour/native-ui/icons/central";
import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Composed icons and a render prop",
	note: "Two tabs rather than three, because a non-scrolling bar splits its width evenly and an icon, a label and a badge do not fit in a third of this screen — the labels truncate. That is the trade a bar without a `Tabs.ScrollView` makes: every tab gets equal room, whether or not it needs it.\n\nThe glyphs are composed, never passed as props: the trigger publishes its size step and its variant's foreground, so a bare `Icon` comes out right with nothing said here. The badge switches `variant` through the render prop, which is the escape hatch for anything a class cannot express.\n\nNote what the render prop does *not* do: it never adds or removes content. A badge that appeared only when selected would change that trigger's width, and a trigger's width is the indicator's geometry — the bar would re-measure and shift on every tab change. Swap a treatment, not a size.\n\nThe glyph still steps at the midpoint while the label beside it fades: an `Icon` takes its colour as a resolved value rather than a style, so it has no way to be half way between two.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Tabs variant="secondary">
			<Tabs.List>
				<Tabs.Indicator />
				<Tabs.Trigger testID="composed-alerts" value="alerts">
					{({ isSelected }) => (
						<>
							<Icon icon={IconBell} />
							<Tabs.Label>Alerts</Tabs.Label>
							<Badge color="danger" size="sm" variant={isSelected ? "solid" : "soft"}>
								3
							</Badge>
						</>
					)}
				</Tabs.Trigger>
				<Tabs.Trigger testID="composed-profile" value="profile">
					<Icon icon={IconUser} />
					<Tabs.Label>Profile</Tabs.Label>
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="alerts">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Three unread alerts.</Text.Paragraph>
				</View>
			</Tabs.Content>
			<Tabs.Content value="profile">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Your profile.</Text.Paragraph>
				</View>
			</Tabs.Content>
		</Tabs>
	);
}
