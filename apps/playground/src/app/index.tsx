import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import {
	IconArrowsRepeatCircle,
	IconBulletList,
	IconCursorClick,
	IconDivider,
	IconSquareCursor,
} from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";

const THEMES = ["light", "dark", "system"] as const;

const COMPONENTS = [
	{
		href: "/button",
		icon: IconSquareCursor,
		title: "Button",
		description: "Variants, sizes, icons, loading",
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
		href: "/separator",
		icon: IconDivider,
		title: "Separator",
		description: "Orientations, insets, weight",
	},
	{
		href: "/spinner",
		icon: IconArrowsRepeatCircle,
		title: "Spinner",
		description: "Sizes, colours, custom glyphs",
	},
] as const;

/**
 * The playground index: one row per component in the library.
 *
 * Doubles as the ListGroup's own smoke test — automatic dividers, the leading
 * icon cascade and the default trailing chevron are all on screen here, so a
 * regression in any of them is visible before a gallery is even opened.
 */
export default function Index(): ReactElement {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { theme, hasAdaptiveThemes } = useUniwind();

	const activeTheme = hasAdaptiveThemes ? "system" : theme;

	return (
		<ScrollView
			className="flex-1 bg-background"
			contentContainerClassName="gap-6 p-5"
			contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top + 16 }}
		>
			<View className="gap-1">
				<Text className="font-bold text-3xl text-foreground">native-ui</Text>
				<Text className="text-base text-muted-foreground">{COMPONENTS.length} components</Text>
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
				{COMPONENTS.map((component) => (
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
		</ScrollView>
	);
}
