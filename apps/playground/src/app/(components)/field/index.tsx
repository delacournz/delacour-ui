import {
	IconEditSmall1,
	IconGroup1,
	IconLayoutAlignLeftRight,
	IconLayoutTopBottom,
	IconWarningSign,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
	{
		description: "Label, control, description and error, and the gap ladder",
		href: "/field/anatomy",
		icon: IconLayoutTopBottom,
		title: "Anatomy",
	},
	{
		description: "Vertical and horizontal, and where Field.Content is needed",
		href: "/field/orientation",
		icon: IconLayoutAlignLeftRight,
		title: "Orientation",
	},
	{
		description: "One flag reddens the label and the control inside it",
		href: "/field/states",
		icon: IconWarningSign,
		title: "Invalid and disabled",
	},
	{
		description: "Field.Set, Field.Legend, Field.Group and Field.Separator",
		href: "/field/grouping",
		icon: IconGroup1,
		title: "Grouping",
	},
	{
		description: "The whole composition, keyboard-aware, under a sticky footer",
		href: "/field/form",
		icon: IconEditSmall1,
		title: "In a form",
	},
];

/**
 * The Field gallery index — a `FolderIndex`, like the other five.
 *
 * A component whose whole job is layout is easier to judge one axis at a time
 * than as one page scrolled past.
 */
export default function FieldGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Field" />;
}
