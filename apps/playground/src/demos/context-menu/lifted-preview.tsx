import { ContextMenu } from "@delacour/react-native-ui/context-menu";
import { IconHeart, IconShareOs, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Lifted preview",
	caption:
		"`ContextMenu.Preview` lifts a copy of the held card over the dimmed list, and the panel opens beside it — never across it.",
	capture: { frame: "device", flow: "context-menu/lifted-preview" },
};

const PLACES = [
	{ name: "Piha", detail: "West coast · black sand" },
	{ name: "Karekare", detail: "West coast · waterfall walk" },
	{ name: "Bethells", detail: "West coast · dunes and lake" },
] as const;

function Place({ name, detail }: { name: string; detail: string }): ReactElement {
	return (
		<View className="gap-1 rounded-lg border border-border bg-card px-4 py-4">
			<Text className="font-medium text-card-foreground">{name}</Text>
			<Text className="text-muted-foreground text-sm">{detail}</Text>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-1 justify-center gap-3 px-screen-gutter">
			{PLACES.map((place) => (
				<ContextMenu key={place.name}>
					<ContextMenu.Trigger haptic="medium" testID={`context-menu-place-${place.name}`}>
						<Place detail={place.detail} name={place.name} />
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Preview />
						<ContextMenu.Item icon={IconHeart} testID={`context-menu-place-${place.name}-favourite`}>
							Favourite
						</ContextMenu.Item>
						<ContextMenu.Item icon={IconShareOs}>Share</ContextMenu.Item>
						<ContextMenu.Separator />
						<ContextMenu.Item icon={IconTrashCan} variant="destructive">
							Remove
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu>
			))}
		</View>
	);
}
