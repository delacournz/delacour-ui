import { useScrollSections } from "@delacour/react-native-ui/hooks/use-scroll-sections";
import { SectionRail } from "@delacour/react-native-ui/section-rail";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "On the start edge",
	caption:
		'`placement="start"` moves the rail to the leading edge — the left in left-to-right, the right in right-to-left — and the panel grows from that side.',
	capture: { align: "stretch" },
};

const SECTIONS = [
	{ id: "overview", title: "Overview", level: 0 },
	{ id: "pricing", title: "Pricing", level: 0 },
	{ id: "features", title: "Features", level: 0 },
	{ id: "reviews", title: "Reviews", level: 0 },
	{ id: "support", title: "Support", level: 0 },
] as const;

export function Demo(): ReactElement {
	const sections = useScrollSections({ readingLine: 16 });

	return (
		<View className="h-130 overflow-hidden rounded-xl border border-border">
			<Animated.ScrollView
				contentContainerClassName="gap-6 p-5 ps-14"
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

			<SectionRail placement="start" onValueChange={sections.scrollTo} value={sections.activeId ?? SECTIONS[0].id}>
				<SectionRail.Trigger testID="section-rail-start-trigger">
					{SECTIONS.map((section) => (
						<SectionRail.Bar key={section.id} level={section.level} value={section.id} />
					))}
				</SectionRail.Trigger>
				<SectionRail.Content>
					{SECTIONS.map((section) => (
						<SectionRail.Item
							key={section.id}
							level={section.level}
							testID={`section-rail-start-${section.id}`}
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
