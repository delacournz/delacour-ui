import { DIRECTIONS, Direction, type DirectionValue } from "@delacour/react-native-ui/direction";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconGlobe } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Mirrored rows",
	caption:
		"The same group twice, once per direction. Nothing in the rows changed: Yoga reverses each row, swaps the start and end insets and right-aligns the text, so the icon leads from the right and the chevron trails to the left.",
	capture: { align: "stretch", hero: true },
};

const LABELS: Record<DirectionValue, string> = {
	ltr: "Left to right",
	rtl: "Right to left",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{DIRECTIONS.map((dir) => (
				<View className="gap-2" key={dir}>
					<Text.Overline>{LABELS[dir]}</Text.Overline>
					<Direction dir={dir}>
						<ListGroup>
							<ListGroup.Item testID={`row-language-${dir}`}>
								<ListGroup.ItemPrefix>
									<Icon icon={IconGlobe} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Language</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>Shown in every menu</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
							<ListGroup.Item>
								<ListGroup.ItemPrefix>
									<Icon icon={IconBell} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
						</ListGroup>
					</Direction>
				</View>
			))}
		</View>
	);
}
