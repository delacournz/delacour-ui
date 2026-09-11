import {
	IconEditSmall1,
	IconExpandSimple,
	IconLayoutAlignBottom,
	IconLayoutBottom,
	IconLayoutTopBottom,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
	{
		description: "Trigger, overlay, content, title, description and close",
		href: "/bottom-sheet/anatomy",
		icon: IconLayoutBottom,
		title: "Anatomy",
	},
	{
		description: "Sized to its content, or pinned to explicit snap points",
		href: "/bottom-sheet/sizing",
		icon: IconExpandSimple,
		title: "Sizing",
	},
	{
		description: "A body taller than the sheet, and the pan it negotiates with",
		href: "/bottom-sheet/scrolling",
		icon: IconLayoutTopBottom,
		title: "Scrolling",
	},
	{
		description: "Inline and sticky, and what each one draws",
		href: "/bottom-sheet/footer",
		icon: IconLayoutAlignBottom,
		title: "Footer",
	},
	{
		description: "Fields inside a sheet, under a footer that rides the keyboard",
		href: "/bottom-sheet/form",
		icon: IconEditSmall1,
		title: "In a form",
	},
];

/**
 * The Bottom sheet gallery index — a `FolderIndex`, like the other five.
 *
 * A component whose behaviour is gesture and keyboard is easier to judge one
 * axis at a time than as one page scrolled past. Two of these routes cannot be
 * judged from a screenshot at all.
 */
export default function BottomSheetGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Bottom sheet" />;
}
