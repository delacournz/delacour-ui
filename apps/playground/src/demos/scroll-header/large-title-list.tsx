import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass, IconPlusMedium } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A large title over a list",
	caption:
		"The title block scrolls away with the list while the bar's own title fades in to replace it, and the bar's surface and hairline arrive with it. Let go half way and it settles open or closed — never stuck between.",
	capture: { frame: "device", flow: "scroll-header/large-title-list", hero: true },
};

const ALBUMS = [
	{ id: "blue", title: "Blue", artist: "Joni Mitchell" },
	{ id: "kind-of-blue", title: "Kind of Blue", artist: "Miles Davis" },
	{ id: "rumours", title: "Rumours", artist: "Fleetwood Mac" },
	{ id: "pet-sounds", title: "Pet Sounds", artist: "The Beach Boys" },
	{ id: "abbey-road", title: "Abbey Road", artist: "The Beatles" },
	{ id: "horses", title: "Horses", artist: "Patti Smith" },
	{ id: "remain", title: "Remain in Light", artist: "Talking Heads" },
	{ id: "hounds", title: "Hounds of Love", artist: "Kate Bush" },
	{ id: "ok-computer", title: "OK Computer", artist: "Radiohead" },
	{ id: "pink-moon", title: "Pink Moon", artist: "Nick Drake" },
	{ id: "astral", title: "Astral Weeks", artist: "Van Morrison" },
	{ id: "songs", title: "Songs in the Key of Life", artist: "Stevie Wonder" },
	{ id: "lorde", title: "Melodrama", artist: "Lorde" },
	{ id: "spirit", title: "Spirit of Eden", artist: "Talk Talk" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader>
				<ScrollHeader.Bar>
					<ScrollHeader.BarTitle>Library</ScrollHeader.BarTitle>
					<View className="ml-auto flex-row gap-2">
						<Button accessibilityLabel="Search" size="icon-sm" variant="secondary">
							<Icon icon={IconMagnifyingGlass} />
						</Button>
						<Button accessibilityLabel="Add album" size="icon-sm" variant="secondary">
							<Icon icon={IconPlusMedium} />
						</Button>
					</View>
				</ScrollHeader.Bar>
				<ScrollHeader.Large>
					<Text.Title>Library</Text.Title>
					<Text.Caption>{`${ALBUMS.length} albums`}</Text.Caption>
				</ScrollHeader.Large>
				<ScrollHeader.ScrollView contentContainerClassName="px-screen-gutter pb-12" testID="scroll-header-list">
					<ListGroup>
						{ALBUMS.map((album) => (
							<ListGroup.Item key={album.id}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{album.title}</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>{album.artist}</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
							</ListGroup.Item>
						))}
					</ListGroup>
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
