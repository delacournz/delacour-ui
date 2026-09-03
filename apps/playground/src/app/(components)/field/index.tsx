import { Icon } from "delacour-react-native-ui/icon";
import {
	IconEditSmall1,
	IconGroup1,
	IconLayoutAlignLeftRight,
	IconLayoutTopBottom,
	IconWarningSign,
} from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";

const DEMOS = [
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
] as const;

/**
 * The Field gallery index.
 *
 * A `Screen` rather than a `GalleryScreen`, matching the Screen and Input
 * indexes — a component whose whole job is layout is easier to judge one axis at
 * a time than as one page scrolled past.
 */
export default function FieldGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Field</Screen.Navbar.Title>
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
					Field is the layout every form repeats, done once. It is also where a field&apos;s state is written down: the
					control inside reads it rather than being told twice.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
