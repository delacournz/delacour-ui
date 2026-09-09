import { resolveFonts } from "@delacour/design-system/resolve";
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
import { useDesignSystem } from "@/design-system/store";
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
 * The large title, at the platform's own step: 34 over 41, semibold.
 *
 * Arbitrary values rather than a scale step because `text-3xl` is 30 and the
 * scale has no 34; the pair is written together so the leading survives the
 * size, the way the library's own presets pair them.
 *
 * The family is set inline from the resolved config rather than through
 * `font-heading`, the same move the customiser's `FontPreview` makes and for
 * the same reason: `--font-heading` is declared only inside the platform
 * `@variant` blocks of `theme.css`, so Tailwind mints no `font-heading`
 * utility from it and the class resolves to nothing — verified on device,
 * where switching the Heading axis to Raleway moved no title while switching
 * the body font moved every line. Inline, the family follows the axis.
 */
const LARGE_TITLE_CLASS = "font-semibold text-[34px] leading-[41px] tracking-tight";

/**
 * The playground index: the library, grouped the way the documentation groups it.
 *
 * The screen the app opens on, and the first place the house shows: the mark
 * leads the navbar, and the product's name — not the package's — opens the
 * content as a large title in the heading face. That title is the one typeset
 * lockup the brand has, since the mark's geometry is binding and there is no
 * wordmark, and the large-title step is where Outfit is actually legible as
 * Outfit; at navbar size it is indistinguishable from the body face, which is
 * why the finish review could find the house's heading face nowhere. Every
 * other title in the app stays inline, in the body face the platform expects
 * of a navigation bar. The count under it is derived from the same index the
 * rows are drawn from.
 *
 * The bar itself carries only the mark and the actions, the way a top-level
 * screen's bar reads before its large title collapses. It does not collapse:
 * that needs a native header this app does not mount, because the navbar on
 * show is the library's own `Screen.Navbar`, the one consumers get. A static
 * bar is HIG-acceptable for a tool; DESIGN.md records the trade.
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
	const { heading } = resolveFonts(useDesignSystem());
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
				<DelacourMark accessibilityLabel="Delacour" accessibilityRole="image" size={MARK_SIZE} />
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
				<View className="gap-1">
					<Text.Display
						accessibilityRole="header"
						className={LARGE_TITLE_CLASS}
						style={heading ? { fontFamily: heading } : undefined}
					>
						Delacour UI
					</Text.Display>
					<Text.Paragraph color="muted">{`${componentCount()} components`}</Text.Paragraph>
				</View>

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
