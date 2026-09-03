import { Tabs, useTabsMotion } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A scroller inside a panel",
	note: "Drag the cards and the strip scrolls; drag the panel beside them and the pager changes tab. A vertical drag anywhere still scrolls this page — the pager gives up on vertical movement rather than negotiating for it, which is what lets it live inside a scrolling screen at all.",
};

/**
 * A horizontal strip that wins its own drags from the pager.
 *
 * Two horizontal gestures over one region is the one conflict the library cannot
 * settle by itself — only the caller knows which should win — so the pager
 * publishes its pan and the strip declares that the pager must wait for this
 * scroll to fail. Without the relation the pager claims the drag and the strip
 * never moves.
 */
function CardStrip(): ReactElement {
	const { panGesture } = useTabsMotion();
	const native = useMemo(() => Gesture.Native().blocksExternalGesture(panGesture), [panGesture]);

	return (
		<GestureDetector gesture={native}>
			<ScrollView contentContainerClassName="gap-2 px-1" horizontal showsHorizontalScrollIndicator={false}>
				{["One", "Two", "Three", "Four", "Five", "Six"].map((card) => (
					<View className="h-20 w-28 items-center justify-center rounded-lg bg-tertiary" key={card}>
						<Text.Label>{card}</Text.Label>
					</View>
				))}
			</ScrollView>
		</GestureDetector>
	);
}

export function Demo(): ReactElement {
	return (
		<Tabs>
			<Tabs.List>
				<Tabs.Indicator />
				<Tabs.Trigger testID="nested-cards" value="cards">
					Cards
				</Tabs.Trigger>
				<Tabs.Trigger testID="nested-plain" value="plain">
					Plain
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="cards">
				<CardStrip />
			</Tabs.Content>
			<Tabs.Content value="plain">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Swipe here and the pager takes it.</Text.Paragraph>
				</View>
			</Tabs.Content>
		</Tabs>
	);
}
