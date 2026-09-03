import { Icon } from "delacour-react-native-ui/icon";
import { IconBell, IconGlobe } from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Spinner } from "delacour-react-native-ui/spinner";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom suffix",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<ListGroup>
			<ListGroup.Item testID="row-language">
				<ListGroup.ItemPrefix>
					<Icon icon={IconGlobe} />
				</ListGroup.ItemPrefix>
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Language</ListGroup.ItemTitle>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix>
					<Text.Caption>English</Text.Caption>
				</ListGroup.ItemSuffix>
			</ListGroup.Item>
			<ListGroup.Item testID="row-notifications">
				<ListGroup.ItemPrefix>
					<Icon icon={IconBell} />
				</ListGroup.ItemPrefix>
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix>
					<View className="h-6 w-6 items-center justify-center rounded-full bg-destructive">
						<Text className="font-bold text-destructive-foreground text-xs">7</Text>
					</View>
				</ListGroup.ItemSuffix>
			</ListGroup.Item>
			<ListGroup.Item testID="row-syncing">
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Syncing</ListGroup.ItemTitle>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix>
					<Spinner color="muted-foreground" size="sm" />
				</ListGroup.ItemSuffix>
			</ListGroup.Item>
			<ListGroup.Item testID="row-chevron">
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Custom chevron</ListGroup.ItemTitle>
					<ListGroup.ItemDescription>iconProps tunes the default glyph</ListGroup.ItemDescription>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix iconProps={{ color: "destructive", size: 22 }} />
			</ListGroup.Item>
		</ListGroup>
	);
}
