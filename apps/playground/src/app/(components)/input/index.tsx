import {
	IconColorSwatch,
	IconEditSmall1,
	IconEyedropper,
	IconLayoutAlignLeftRight,
	IconRuler,
	IconSettingsToggle1,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
	{
		description: "Primary and secondary, at rest, focused, invalid and disabled",
		href: "/input/variants",
		icon: IconColorSwatch,
		title: "Variants",
	},
	{
		description: "The input scale, and a multiline field that grows",
		href: "/input/sizes",
		icon: IconRuler,
		title: "Sizes",
	},
	{
		description: "Invalid, disabled, read-only, secure, keyboard types",
		href: "/input/states",
		icon: IconSettingsToggle1,
		title: "States",
	},
	{
		description: "Prefix and suffix icons, affixes and controls inside the box",
		href: "/input/group",
		icon: IconLayoutAlignLeftRight,
		title: "Input.Group",
	},
	{
		description: "Placeholder, caret and selection, from accent classes",
		href: "/input/colors",
		icon: IconEyedropper,
		title: "Colours",
	},
	{
		description: "Labels, a sticky footer, and the keyboard clearing both",
		href: "/input/form",
		icon: IconEditSmall1,
		title: "In a form",
	},
];

/**
 * The Input gallery index — a `FolderIndex`, like the other five.
 *
 * A component with this many axes gets a page per axis instead of one page
 * that has to be scrolled past to reach the thing you came for.
 */
export default function InputGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Input" />;
}
