import { useScrollSections } from "@delacour/react-native-ui/hooks/use-scroll-sections";
import { SectionProgress } from "@delacour/react-native-ui/section-progress";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Article",
	caption:
		"`useScrollSections` tracks the scroll view; the pill reads its `progress`, `activeId` and `scrollTo`. The ring fills on the UI thread — the render count under the stage moves only when the section does, never per frame. Tap the pill to jump to a section.",
};

const SECTIONS = [
	{ id: "overview", title: "Overview" },
	{ id: "what-we-collect", title: "What we collect" },
	{ id: "how-we-use-it", title: "How we use it" },
	{ id: "sharing", title: "Sharing" },
	{ id: "retention", title: "Retention" },
	{ id: "your-rights", title: "Your rights" },
	{ id: "deleting-your-account", title: "Deleting your account" },
	{ id: "contact", title: "Contact" },
] as const;

const BODY =
	"Each section is a direct child of the scroll content and registers its offset through onLayout. The hook resolves which one sits under the reading line on every frame, and crosses to React only when that changes.";

/** Room at the end of the content so the pill never covers the last line. */
const END_PADDING = 120;

export function Demo(): ReactElement {
	const sections = useScrollSections({ readingLine: 48 });
	const renders = useRef(0);
	renders.current += 1;

	return (
		<View className="w-full gap-2">
			<View className="h-[440px] w-full overflow-hidden rounded-xl border border-border bg-background">
				<Animated.ScrollView
					contentContainerStyle={{ paddingBottom: END_PADDING }}
					nestedScrollEnabled
					onScroll={sections.scrollHandler}
					ref={sections.scrollRef}
					scrollEventThrottle={16}
					testID="section-progress-article-scroll"
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
					scroll={sections}
					testID="section-progress-article"
					value={sections.activeId}
				>
					{SECTIONS.map((section) => (
						<SectionProgress.Item key={section.id} testID={`section-progress-article-${section.id}`} value={section.id}>
							{section.title}
						</SectionProgress.Item>
					))}
				</SectionProgress>
			</View>
			<Text.Caption color="muted" testID="section-progress-article-renders">
				{`Demo renders: ${renders.current}`}
			</Text.Caption>
		</View>
	);
}
