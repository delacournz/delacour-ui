import { SectionRail } from "@delacour/react-native-ui/section-rail";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Driving a pager",
	caption:
		"There is no pager mode: the rail's `value` is the page index, and a pick scrolls the pager. Swipe the pages or scrub the rail — each follows the other.",
};

const PAGES = [
	{ id: "welcome", title: "Welcome" },
	{ id: "profile", title: "Your profile" },
	{ id: "interests", title: "Interests" },
	{ id: "notifications", title: "Notifications" },
	{ id: "done", title: "All set" },
] as const;

export function Demo(): ReactElement {
	const pager = useRef<ScrollView>(null);
	const [width, setWidth] = useState(0);
	const [page, setPage] = useState<string>(PAGES[0].id);

	const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (width === 0) return;
		const index = Math.round(event.nativeEvent.contentOffset.x / width);
		const next = PAGES[index];
		if (next) setPage(next.id);
	};

	const goTo = (id: string) => {
		const index = PAGES.findIndex((entry) => entry.id === id);
		if (index === -1) return;
		setPage(id);
		pager.current?.scrollTo({ animated: true, x: index * width });
	};

	return (
		<View
			className="h-100 overflow-hidden rounded-xl border border-border"
			onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
		>
			<ScrollView
				horizontal
				onMomentumScrollEnd={handleMomentumEnd}
				pagingEnabled
				ref={pager}
				showsHorizontalScrollIndicator={false}
			>
				{PAGES.map((entry, index) => (
					<View className="justify-center gap-2 p-6 pe-14" key={entry.id} style={{ width }}>
						<Text.Overline>{`Step ${index + 1} of ${PAGES.length}`}</Text.Overline>
						<Text.Title>{entry.title}</Text.Title>
						<Text.Paragraph>Swipe sideways for the next page, or pick one from the rail.</Text.Paragraph>
					</View>
				))}
			</ScrollView>

			<SectionRail onValueChange={goTo} value={page}>
				<SectionRail.Trigger testID="section-rail-pager-trigger">
					{PAGES.map((entry) => (
						<SectionRail.Bar key={entry.id} value={entry.id} />
					))}
				</SectionRail.Trigger>
				<SectionRail.Content>
					{PAGES.map((entry) => (
						<SectionRail.Item key={entry.id} testID={`section-rail-pager-${entry.id}`} value={entry.id}>
							{entry.title}
						</SectionRail.Item>
					))}
				</SectionRail.Content>
			</SectionRail>
		</View>
	);
}
