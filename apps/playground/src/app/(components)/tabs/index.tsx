import {
	IconAlignHorizontalCenter,
	IconColorPalette,
	IconHandTouch,
	IconLayoutGrid1,
	IconRuler,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
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
];

/**
 * The Tabs gallery index — a `FolderIndex`, like the other five.
 *
 * Each demo needs a page of its own here for a reason the others do not
 * share: a swipeable bar is a horizontal pan inside a vertical scroll area, and
 * five of them stacked would make every one feel broken while telling you
 * nothing about any of them.
 */
export default function TabsGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Tabs" />;
}
