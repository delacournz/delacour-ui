import {
	IconBubble2,
	IconBulletList,
	IconEditSmall1,
	IconLayoutAllSides,
	IconLayoutBottom,
	IconLayoutTop,
	IconLayoutTopBottom,
	IconWarningSign,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
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
];

/**
 * The Screen gallery index — a `FolderIndex`, like the other five.
 *
 * Itself a `Screen`, through `FolderIndex`, so the plain navbar-plus-scroll
 * composition is on show here and needs no demo of its own — and so this page
 * proves the API on the way to demonstrating it. The eight routes beneath it
 * are screens themselves and must not be nested inside another one.
 */
export default function ScreenGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Screen" />;
}
