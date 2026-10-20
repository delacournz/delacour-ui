import { useScrollSections } from "@delacour/react-native-ui/hooks/use-scroll-sections";
import { SectionProgress, type SectionProgressColor } from "@delacour/react-native-ui/section-progress";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Coloured sections",
	caption:
		"An item's `color` paints its marker in the panel, and the ring while that section is being read — a warning section turns the ring amber as the reader enters it.",
	capture: { align: "stretch", flow: true, hero: true },
};

const SECTIONS: readonly { id: string; title: string; color: SectionProgressColor }[] = [
	{ id: "summary", title: "Summary", color: "foreground" },
	{ id: "whats-new", title: "What's new", color: "primary" },
	{ id: "fixed", title: "Fixed", color: "success" },
	{ id: "known-issues", title: "Known issues", color: "warning" },
	{ id: "notes", title: "Notes", color: "info" },
	{ id: "removed", title: "Removed", color: "destructive" },
];

const BODY =
	"Release notes, one section per kind of change. Scroll through and watch the ring take each section's colour as it becomes the one under the reading line.";

export function Demo(): ReactElement {
	const sections = useScrollSections({ readingLine: 48 });

	return (
		<View className="h-[440px] w-full overflow-hidden rounded-xl border border-border bg-background">
			<Animated.ScrollView
				contentContainerStyle={{ paddingBottom: 120 }}
				nestedScrollEnabled
				onScroll={sections.scrollHandler}
				ref={sections.scrollRef}
				scrollEventThrottle={16}
				testID="section-progress-colored-scroll"
			>
				{SECTIONS.map((section) => (
					<View className="gap-2 px-4 pt-6" key={section.id} onLayout={sections.register(section.id)}>
						<Text.Header>{section.title}</Text.Header>
						<Text.Paragraph color="muted">{BODY}</Text.Paragraph>
						<Text.Paragraph color="muted">{BODY}</Text.Paragraph>
					</View>
				))}
			</Animated.ScrollView>
			<SectionProgress
				onValueChange={sections.scrollTo}
				revealAt={0}
				scroll={sections}
				testID="section-progress-colored"
				value={sections.activeId}
			>
				{SECTIONS.map((section) => (
					<SectionProgress.Item
						color={section.color}
						key={section.id}
						testID={`section-progress-colored-${section.id}`}
						value={section.id}
					>
						{section.title}
					</SectionProgress.Item>
				))}
			</SectionProgress>
		</View>
	);
}
