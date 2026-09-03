import { Icon } from "delacour-react-native-ui/icon";
import {
	IconColorSwatch,
	IconEditSmall1,
	IconEyedropper,
	IconLayoutAlignLeftRight,
	IconRuler,
	IconSettingsToggle1,
} from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";

const DEMOS = [
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
] as const;

/**
 * The Input gallery index.
 *
 * A `Screen` rather than a `GalleryScreen`, matching the Screen gallery's own
 * index — a component with this many axes gets a page per axis instead of one
 * page that has to be scrolled past to reach the thing you came for.
 */
export default function InputGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Input</Screen.Navbar.Title>
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
					A field and the box `Input.Group` draws around one read the same slot, so a grouped input is the same box as a
					lone one rather than a copy of it.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
