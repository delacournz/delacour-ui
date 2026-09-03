import { Icon } from "delacour-react-native-ui/icon";
import {
	IconEditSmall1,
	IconExpandSimple,
	IconLayoutAlignBottom,
	IconLayoutBottom,
	IconLayoutTopBottom,
} from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";

const DEMOS = [
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
] as const;

/**
 * The BottomSheet gallery index.
 *
 * A `Screen` rather than a `GalleryScreen`, matching Field, Input and Screen —
 * a component whose behaviour is gesture and keyboard is easier to judge one
 * axis at a time than as one page scrolled past. Two of these routes cannot be
 * judged from a screenshot at all.
 */
export default function BottomSheetGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Bottom sheet</Screen.Navbar.Title>
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
					The sheet is the library&apos;s first overlay. Two of its parts — the scrim and a sticky footer — are written
					in the tree and drawn somewhere else, because gorhom takes both as render props.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
