import { useScrollSections } from "@delacour/react-native-ui/hooks/use-scroll-sections";
import { SectionRail } from "@delacour/react-native-ui/section-rail";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nested levels",
	caption:
		"`level` shortens a bar and indents its row by the same step, so the rail and the outline agree about what nests. Level 2 and deeper share the shortest bar; long titles wrap to two lines, then truncate.",
	capture: { align: "stretch", flow: "section-rail/nested-levels" },
};

const SECTIONS = [
	{ id: "basics", title: "The basics", level: 0 },
	{ id: "layout", title: "Layout", level: 0 },
	{ id: "layout-flex", title: "Flexbox", level: 1 },
	{ id: "layout-flex-wrap", title: "Wrapping and the cross axis, when rows run out of room", level: 2 },
	{ id: "layout-grid", title: "Grids", level: 1 },
	{ id: "type", title: "Typography", level: 0 },
	{ id: "type-scale", title: "The type scale", level: 1 },
	{ id: "colour", title: "Colour", level: 0 },
] as const;

export function Demo(): ReactElement {
	const sections = useScrollSections({ readingLine: 16 });

	return (
		<View className="h-130 overflow-hidden rounded-xl border border-border">
			<Animated.ScrollView
				contentContainerClassName="gap-6 p-5 pe-14"
				onScroll={sections.scrollHandler}
				ref={sections.scrollRef}
				scrollEventThrottle={16}
			>
				{SECTIONS.map((section) => (
					<View className="gap-2" key={section.id} onLayout={sections.register(section.id)}>
						{section.level === 0 ? (
							<Text.Header>{section.title}</Text.Header>
						) : (
							<Text.Subheader>{section.title}</Text.Subheader>
						)}
						<Text.Paragraph>
							Every section of a long page gets a bar on the rail. The bar of the section you are reading is drawn in
							the foreground, so the rail doubles as a scrollbar that knows the outline.
						</Text.Paragraph>
						<Text.Paragraph>
							Open the rail to read the titles, then tap one to jump. The panel lingers for a moment after a pick, so a
							mis-tap can be corrected before it closes.
						</Text.Paragraph>
					</View>
				))}
			</Animated.ScrollView>

			<SectionRail onValueChange={sections.scrollTo} value={sections.activeId ?? SECTIONS[0].id}>
				<SectionRail.Trigger testID="section-rail-nested-trigger">
					{SECTIONS.map((section) => (
						<SectionRail.Bar key={section.id} level={section.level} value={section.id} />
					))}
				</SectionRail.Trigger>
				<SectionRail.Content>
					{SECTIONS.map((section) => (
						<SectionRail.Item
							key={section.id}
							level={section.level}
							testID={`section-rail-nested-${section.id}`}
							value={section.id}
						>
							{section.title}
						</SectionRail.Item>
					))}
				</SectionRail.Content>
			</SectionRail>
		</View>
	);
}
