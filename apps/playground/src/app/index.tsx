import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import {
	IconArrowsRepeatCircle,
	IconBulletList,
	IconCircleRecord,
	IconCursorClick,
	IconDiamond,
	IconDivider,
	IconFontStyle,
	IconLayoutTopBottom,
	IconParagraph,
	IconSettingsSliderHor,
	IconSquareCheck,
	IconSquareCursor,
	IconTag,
	IconWindowCursor,
} from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

const THEMES = ["light", "dark", "system"] as const;

const COMPONENTS = [
	{
		href: "/badge",
		icon: IconTag,
		title: "Badge",
		description: "Variants, colours, sizes, dismiss",
	},
	{
		href: "/button",
		icon: IconSquareCursor,
		title: "Button",
		description: "Variants, sizes, icons, loading",
	},
	{
		href: "/checkbox",
		icon: IconSquareCheck,
		title: "Checkbox",
		description: "Colours, sizes, indeterminate, groups",
	},
	{
		href: "/field",
		icon: IconParagraph,
		title: "Field",
		description: "Form layout, grouping, state cascade",
	},
	{
		href: "/input",
		icon: IconWindowCursor,
		title: "Input",
		description: "Variants, sizes, prefix and suffix",
	},
	{
		href: "/list-group",
		icon: IconBulletList,
		title: "ListGroup",
		description: "Grouped rows, dividers, slots",
	},
	{
		href: "/pressable",
		icon: IconCursorClick,
		title: "Pressable",
		description: "Gestures, haptics, asChild",
	},
	{
		href: "/radio",
		icon: IconCircleRecord,
		title: "Radio",
		description: "Groups, selection, sizes, orientation",
	},
	{
		href: "/separator",
		icon: IconDivider,
		title: "Separator",
		description: "Orientations, insets, weight",
	},
	{
		href: "/screen",
		icon: IconLayoutTopBottom,
		title: "Screen",
		description: "Navbar, footer, scrollables, keyboard",
	},
	{
		href: "/slider",
		icon: IconSettingsSliderHor,
		title: "Slider",
		description: "Range, orientation, colours, steps",
	},
	{
		href: "/spinner",
		icon: IconArrowsRepeatCircle,
		title: "Spinner",
		description: "Sizes, colours, custom glyphs",
	},
	{
		href: "/text",
		icon: IconFontStyle,
		title: "Text",
		description: "Type scale, presets, inline nesting",
	},
] as const;

/**
 * Brand art, not part of the library — the row is a way to eyeball the app icon
 * against the component that redraws it, which is only ever a development
 * concern. `__DEV__` is compiled to `false` in a release bundle, so Metro's
 * dead-code pass drops the row and this array with it.
 */
const DEV_COMPONENTS = [
	{
		href: "/delacour-mark",
		icon: IconDiamond,
		title: "DelacourMark",
		description: "The app icon, as react-native-svg",
	},
] as const;

type ComponentRow = (typeof COMPONENTS)[number] | (typeof DEV_COMPONENTS)[number];

const VISIBLE_COMPONENTS: readonly ComponentRow[] = __DEV__ ? [...COMPONENTS, ...DEV_COMPONENTS] : COMPONENTS;

/**
 * The playground index: one row per component in the library.
 *
 * Doubles as the ListGroup's own smoke test — automatic dividers, the leading
 * icon cascade and the default trailing chevron are all on screen here, so a
 * regression in any of them is visible before a gallery is even opened.
 */
export default function Index(): ReactElement {
	const router = useRouter();
	const { theme, hasAdaptiveThemes } = useUniwind();

	const activeTheme = hasAdaptiveThemes ? "system" : theme;

	return (
		<Screen>
			<Screen.ScrollArea contentContainerClassName="gap-6">
				<View className="gap-1">
					<Text.Display>native-ui</Text.Display>
					<Text.Paragraph color="muted">{COMPONENTS.length} components</Text.Paragraph>
				</View>

				<View className="flex-row gap-2">
					{THEMES.map((name) => (
						<Button
							key={name}
							onPress={() => Uniwind.setTheme(name)}
							size="sm"
							variant={activeTheme === name ? "primary" : "outline"}
						>
							{name}
						</Button>
					))}
				</View>

				<ListGroup>
					{VISIBLE_COMPONENTS.map((component) => (
						<ListGroup.Item haptic="selection" key={component.href} onPress={() => router.push(component.href)}>
							<ListGroup.ItemPrefix>
								<Icon icon={component.icon} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{component.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{component.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>
			</Screen.ScrollArea>
		</Screen>
	);
}
