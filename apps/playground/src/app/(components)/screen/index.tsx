import { Icon } from "@delacour/native-ui/icon";
import {
	IconBubble2,
	IconBulletList,
	IconEditSmall1,
	IconLayoutAllSides,
	IconLayoutBottom,
	IconLayoutTop,
	IconLayoutTopBottom,
	IconWarningSign,
} from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { Text, View } from "react-native";

const DEMOS = [
	{
		description: "Overlay vs static navbar, footer, debug overlay",
		href: "/screen/scroll",
		icon: IconLayoutTopBottom,
		title: "Scroll + footer",
	},
	{
		description: "Title, subtitle, centre slot, actions, back glyphs",
		href: "/screen/navbar",
		icon: IconLayoutTop,
		title: "Navbar",
	},
	{
		description: "Overlay, static and sticky placements",
		href: "/screen/footer",
		icon: IconLayoutBottom,
		title: "Footer",
	},
	{
		description: "Screen.View, and Content safe-area edges",
		href: "/screen/view",
		icon: IconLayoutAllSides,
		title: "Static body",
	},
	{
		description: "FlatList, SectionList and LegendList",
		href: "/screen/lists",
		icon: IconBulletList,
		title: "Lists",
	},
	{
		description: "Focused field clears the keyboard and the footer",
		href: "/screen/form",
		icon: IconEditSmall1,
		title: "Keyboard-aware form",
	},
	{
		description: "Composer rides the keyboard, newest message stays clear",
		href: "/screen/chat",
		icon: IconBubble2,
		title: "Chat list",
	},
	{
		description: "Screen.Loading and Screen.Error",
		href: "/screen/states",
		icon: IconWarningSign,
		title: "Loading and error",
	},
] as const;

/**
 * The Screen gallery index.
 *
 * Itself a `Screen` rather than a `GalleryScreen`, so the plain
 * navbar-plus-scroll-plus-footer composition is on show here and needs no demo
 * of its own — and so this page proves the API on the way to demonstrating it.
 *
 * Doubles as the navbar's own smoke test: the content passes under an overlay
 * bar rather than starting below it, the title and subtitle stack on the back
 * button as they do in every other gallery, and the hairline is drawn from the
 * first frame — the Navbar demo toggles that to a scroll-linked fade.
 */
export default function ScreenGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Screen</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${DEMOS.length} variations`}</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6 p-5">
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

				<Text className="text-muted-foreground text-sm">
					This page names no safe-area inset and no navbar height. The navbar measures itself into the screen context
					and the scroll area reserves exactly that.
				</Text>
			</Screen.ScrollArea>
		</Screen>
	);
}
