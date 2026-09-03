import { Icon } from "delacour-react-native-ui/icon";
import {
	IconAlignHorizontalCenter,
	IconColorPalette,
	IconHandTouch,
	IconLayoutGrid1,
	IconRuler,
} from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";

const DEMOS = [
	{
		description: "A capsule in a track, and an underline",
		href: "/tabs/variants",
		icon: IconColorPalette,
		title: "Variants",
	},
	{
		description: "One axis drives the floor, the padding and the label step",
		href: "/tabs/sizes",
		icon: IconRuler,
		title: "Sizes",
	},
	{
		description: "The pan, the fling, the rubber band, and a rejected change",
		href: "/tabs/swipe",
		icon: IconHandTouch,
		title: "Swipe",
	},
	{
		description: "Twelve tabs, four alignments, and both clamps",
		href: "/tabs/scrolling",
		icon: IconAlignHorizontalCenter,
		title: "Scrolling",
	},
	{
		description: "Separators, render props, a custom indicator, nested scrollables",
		href: "/tabs/composition",
		icon: IconLayoutGrid1,
		title: "Composition",
	},
] as const;

/**
 * The Tabs gallery index.
 *
 * A `Screen` rather than a `GalleryScreen`, matching the Field, Input and Screen
 * indexes. Each demo needs a page of its own here for a reason the others do not
 * share: a swipeable bar is a horizontal pan inside a vertical scroll area, and
 * three of them stacked would make every one feel broken while telling you
 * nothing about any of them.
 */
export default function TabsGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Tabs</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${DEMOS.length} variations`}</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
				<ListGroup>
					{DEMOS.map((demo) => (
						<ListGroup.Item haptic="selection" key={demo.href} onPress={() => router.push(demo.href)}>
							<ListGroup.ItemPrefix>
								<Icon icon={demo.icon} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{demo.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{demo.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>

				<Text.Caption>
					The whole component moves off one shared value — a float index into the panels&apos; own order. The indicator,
					the panels and every separator read it, so the capsule follows a finger through a swipe rather than snapping
					when it is let go.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
