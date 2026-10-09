import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconArrowExpandVer,
	IconArrowLeftRight,
	IconArrowsRepeatCircle,
	IconAsterisk,
	IconBell,
	IconBold,
	IconBrowserTabs,
	IconBubble2,
	IconBulletList,
	IconCalendar1,
	IconChart1,
	IconChevronGrabberVertical,
	IconCircleInfo,
	IconCircleRecord,
	IconCursorClick,
	IconDiamond,
	IconDivider,
	IconExclamationTriangle,
	IconFilter1,
	IconFontStyle,
	IconGauge,
	IconInboxEmpty,
	IconLayoutBottomFull,
	IconLayoutLeft,
	IconLayoutTopBottom,
	IconLayoutWindow,
	IconNoteText,
	IconNumberedList,
	IconParagraph,
	IconPeople,
	IconPlaceholder,
	IconProgress75,
	IconSettingsSliderHor,
	IconSidebar,
	IconSquareBehindSquare1,
	IconSquareCheck,
	IconSquareCursor,
	IconStar,
	IconStarLines,
	IconTag,
	IconToggle,
	IconTrending4,
	IconWindow,
	IconWindowCursor,
} from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Screen } from "@delacour/react-native-ui/screen";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ThemeToggle } from "@/components/theme-toggle";
import { type ComponentIndexEntry, type ComponentSlug, componentCount, groupedComponents } from "@/components-index";
import { LIST_GAP, SECTION_GAP } from "@/tokens";

/**
 * One glyph per screen, keyed by slug so a row added to `components-index.ts`
 * without a glyph here is a type error rather than a blank prefix.
 */
const ICONS: Record<ComponentSlug, IconComponent> = {
	accordion: IconChevronGrabberVertical,
	alert: IconExclamationTriangle,
	avatar: IconPeople,
	badge: IconTag,
	"bottom-sheet": IconLayoutBottomFull,
	button: IconSquareCursor,
	calendar: IconCalendar1,
	card: IconLayoutWindow,
	checkbox: IconSquareCheck,
	"empty-state": IconInboxEmpty,
	chart: IconChart1,
	collapsible: IconArrowExpandVer,
	drawer: IconSidebar,
	dialog: IconWindow,
	feedback: IconBubble2,
	chip: IconFilter1,
	field: IconParagraph,
	icon: IconStar,
	input: IconWindowCursor,
	item: IconLayoutLeft,
	kpi: IconTrending4,
	label: IconAsterisk,
	"list-group": IconBulletList,
	meter: IconGauge,
	popover: IconBubble2,
	pressable: IconCursorClick,
	progress: IconProgress75,
	radio: IconCircleRecord,
	rating: IconStarLines,
	separator: IconDivider,
	skeleton: IconPlaceholder,
	screen: IconLayoutTopBottom,
	slider: IconSettingsSliderHor,
	spinner: IconArrowsRepeatCircle,
	steps: IconNumberedList,
	surface: IconSquareBehindSquare1,
	swipe: IconArrowLeftRight,
	switch: IconToggle,
	tabs: IconBrowserTabs,
	text: IconFontStyle,
	textarea: IconNoteText,
	"toggle-button": IconBold,
	tooltip: IconCircleInfo,
	toast: IconBell,
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

/**
 * Every component gallery, grouped the way the documentation groups it.
 *
 * The groups are the docs' eight, in the docs' order, so a reader who found a
 * component on the site finds it in the same place here. Eight headings over
 * forty rows says what each run of rows has in common where an alphabet says
 * nothing. `components-index.test.ts` holds the two apps' groupings together.
 *
 * The back button carries the title and the counts, the way `BlockScreen` does
 * for `/blocks`: the large title and the mark belong to the hub this pushes from.
 *
 * Doubles as the ListGroup's own smoke test — automatic dividers, the leading
 * icon cascade and the default trailing chevron are all on screen here, so a
 * regression in any of them is visible before a gallery is even opened.
 */
export default function Components(): ReactElement {
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
			<Screen.Navbar actions={<ThemeToggle />}>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Components</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${componentCount()} components · ${groups.length} groups`}</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
				{groups.map((group) => (
					<View className={SECTION_GAP} key={group.name}>
						<Text.Kicker>{group.name}</Text.Kicker>
						<Surface material="tray">
							<ListGroup className="rounded-xl">
								{group.entries.map((entry) => row(entry, iconFor(entry.slug)))}
							</ListGroup>
						</Surface>
					</View>
				))}

				{__DEV__ ? (
					<View className={SECTION_GAP}>
						<Text.Kicker>Development</Text.Kicker>
						<Surface material="tray">
							<ListGroup className="rounded-xl">{DEV_ROWS.map((entry) => row(entry, entry.icon))}</ListGroup>
						</Surface>
					</View>
				) : null}
			</Screen.ScrollArea>
			<Screen.ScrollShadow />
		</Screen>
	);
}
