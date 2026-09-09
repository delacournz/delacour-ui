import { Icon, type IconComponent } from "delacour-react-native-ui/icon";
import {
	IconArrowsRepeatCircle,
	IconBrowserTabs,
	IconBulletList,
	IconChart1,
	IconChevronGrabberVertical,
	IconCircleRecord,
	IconCursorClick,
	IconDiamond,
	IconDivider,
	IconFontStyle,
	IconLayoutBottomFull,
	IconLayoutTopBottom,
	IconParagraph,
	IconSettingsSliderHor,
	IconSquareCheck,
	IconSquareCursor,
	IconStar,
	IconTag,
	IconToggle,
	IconWindowCursor,
} from "delacour-react-native-ui/icons/central";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { DelacourMark } from "@/components/delacour-mark";
import { ThemeTrigger } from "@/components/theme/theme-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { type ComponentIndexEntry, type ComponentSlug, componentCount, groupedComponents } from "@/components-index";
import { LIST_GAP, SECTION_GAP } from "@/tokens";

/**
 * One glyph per screen, keyed by slug so a row added to `components-index.ts`
 * without a glyph here is a type error rather than a blank prefix.
 */
const ICONS: Record<ComponentSlug, IconComponent> = {
	accordion: IconChevronGrabberVertical,
	badge: IconTag,
	"bottom-sheet": IconLayoutBottomFull,
	button: IconSquareCursor,
	checkbox: IconSquareCheck,
	chart: IconChart1,
	field: IconParagraph,
	icon: IconStar,
	input: IconWindowCursor,
	"list-group": IconBulletList,
	pressable: IconCursorClick,
	radio: IconCircleRecord,
	separator: IconDivider,
	screen: IconLayoutTopBottom,
	slider: IconSettingsSliderHor,
	spinner: IconArrowsRepeatCircle,
	switch: IconToggle,
	tabs: IconBrowserTabs,
	text: IconFontStyle,
};

/**
 * Brand art, not part of the library — the row is a way to eyeball the app icon
 * against the component that redraws it, which is only ever a development
 * concern. `__DEV__` is compiled to `false` in a release bundle, so Metro's
 * dead-code pass drops the row and this group with it.
 */
const DEV_ROWS: readonly (ComponentIndexEntry & { icon: IconComponent })[] = [
	{
		slug: "delacour-mark",
		href: "/delacour-mark",
		icon: IconDiamond,
		title: "DelacourMark",
		description: "The app icon, as react-native-svg",
		group: "Utilities",
	},
];

/** The size the mark is drawn at in the navbar: the navbar's own icon step, at life size. */
const MARK_SIZE = 28;

/**
 * The playground index: the library, grouped the way the documentation groups it.
 *
 * The screen the app opens on, and the first place the house shows: the mark
 * leads the navbar, the title is the product's name rather than the package's,
 * and the count is derived from the same index the rows are drawn from. The
 * navbar is the library's own `Screen.Navbar` — a large title that collapses
 * to inline on scroll needs a native header this app does not mount, and a
 * static bar is HIG-acceptable for a tool; DESIGN.md records the trade.
 *
 * The groups are the docs' eight, in the docs' order, so a reader who found a
 * component on the site finds it in the same place here. Eight headings over
 * nineteen rows is not many rows per heading, and that is the point: "Forms"
 * over six rows says what the six have in common where an alphabet says
 * nothing. `components-index.test.ts` holds the two apps' groupings together.
 *
 * Doubles as the ListGroup's own smoke test — automatic dividers, the leading
 * icon cascade and the default trailing chevron are all on screen here, so a
 * regression in any of them is visible before a gallery is even opened.
 */
export default function Index(): ReactElement {
	const router = useRouter();
	const groups = groupedComponents();
	const iconFor = (slug: ComponentSlug): IconComponent => ICONS[slug];

	const row = (entry: ComponentIndexEntry, icon: IconComponent) => (
		<ListGroup.Item haptic="selection" key={entry.slug} onPress={() => router.push(entry.href)}>
			<ListGroup.ItemPrefix>
				<Icon icon={icon} />
			</ListGroup.ItemPrefix>
			<ListGroup.ItemContent>
				<ListGroup.ItemTitle>{entry.title}</ListGroup.ItemTitle>
				<ListGroup.ItemDescription>{entry.description}</ListGroup.ItemDescription>
			</ListGroup.ItemContent>
			<ListGroup.ItemSuffix />
		</ListGroup.Item>
	);

	return (
		<Screen>
			<Screen.Navbar
				actions={
					<>
						<ThemeTrigger />
						<ThemeToggle />
					</>
				}
				placement="static"
			>
				<View className="flex-row items-center gap-3">
					<DelacourMark accessibilityLabel="Delacour" accessibilityRole="image" size={MARK_SIZE} />
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Delacour UI</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${componentCount()} components`}</Screen.Navbar.Subtitle>
					</View>
				</View>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
				{groups.map((group) => (
					<View className={SECTION_GAP} key={group.name}>
						<Text.Overline>{group.name}</Text.Overline>
						<ListGroup>{group.entries.map((entry) => row(entry, iconFor(entry.slug)))}</ListGroup>
					</View>
				))}

				{__DEV__ ? (
					<View className={SECTION_GAP}>
						<Text.Overline>Development</Text.Overline>
						<ListGroup>{DEV_ROWS.map((entry) => row(entry, entry.icon))}</ListGroup>
					</View>
				) : null}
			</Screen.ScrollArea>
			<Screen.ScrollShadow />
		</Screen>
	);
}
