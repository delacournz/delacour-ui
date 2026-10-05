import { Icon } from "@delacour/react-native-ui/icon";
import { IconFlag1, IconImages1, IconShareOs, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Floating bar",
	caption:
		'`placement="floating"` lifts the actions into an inset card instead of a full-width edge. `isShownWhenEmpty` keeps it up while nothing is picked.',
	capture: { align: "stretch", flow: "selection-mode/floating-bar" },
};

const ALBUMS = [
	{ id: "a1", title: "Coromandel", count: 214 },
	{ id: "a2", title: "Wedding", count: 932 },
	{ id: "a3", title: "Studio", count: 48 },
	{ id: "a4", title: "Screenshots", count: 1207 },
	{ id: "a5", title: "Receipts", count: 61 },
] as const;

/** Each action receives the selection as it stands at the press. */
const noop = (_selected: string[]): void => undefined;

export function Demo(): ReactElement {
	return (
		<View className="h-[480px]">
			<SelectionMode defaultActive values={ALBUMS.map((album) => album.id)}>
				<ScrollView contentContainerClassName="pb-28">
					<SelectionMode.Group>
						{ALBUMS.map((album) => (
							<SelectionMode.Item key={album.id} testID={`album-${album.id}`} value={album.id}>
								<Item>
									<Item.Media variant="icon">
										<Icon icon={IconImages1} />
									</Item.Media>
									<Item.Content>
										<Item.Title>{album.title}</Item.Title>
										<Item.Description>{`${album.count} photos`}</Item.Description>
									</Item.Content>
								</Item>
							</SelectionMode.Item>
						))}
					</SelectionMode.Group>
				</ScrollView>
				<SelectionMode.Bar isSafeAreaAware={false} isShownWhenEmpty placement="floating">
					<SelectionMode.Action icon={IconShareOs} onPress={noop}>
						Share
					</SelectionMode.Action>
					<SelectionMode.Action icon={IconFlag1} onPress={noop}>
						Flag
					</SelectionMode.Action>
					<SelectionMode.Action icon={IconTrashCan} isDestructive isExitOnPress onPress={noop}>
						Delete
					</SelectionMode.Action>
				</SelectionMode.Bar>
			</SelectionMode>
		</View>
	);
}
