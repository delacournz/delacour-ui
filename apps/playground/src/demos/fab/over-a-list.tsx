import { Fab } from "@delacour/react-native-ui/fab";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPlusLarge } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Over a list",
	caption:
		"One primary action pinned to the bottom corner of the screen it belongs to. The list pads its bottom by the fab's height plus its offset, so the last row can scroll clear of it.",
};

const NOTES = [
	"Groceries",
	"Trip to the coast",
	"Book club picks",
	"Garden plan",
	"Gift ideas",
	"Recipes to try",
	"Reading list",
	"Weekend jobs",
] as const;

export function Demo(): ReactElement {
	return (
		<View className="h-96 overflow-hidden rounded-xl border border-border bg-background">
			<ScrollView contentContainerClassName="pb-24">
				{NOTES.map((note) => (
					<View className="border-border border-b px-4 py-3" key={note}>
						<Text className="font-medium">{note}</Text>
					</View>
				))}
			</ScrollView>
			<Fab accessibilityLabel="New note" isSafeAreaAware={false} placement="bottom-end" testID="fab-new-note">
				<Icon icon={IconPlusLarge} />
			</Fab>
		</View>
	);
}
