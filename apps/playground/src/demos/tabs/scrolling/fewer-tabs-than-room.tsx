import { Button } from "delacour-react-native-ui/button";
import { TABS_SCROLL_ALIGNS, Tabs, type TabsScrollAlign } from "delacour-react-native-ui/tabs";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Fewer tabs than room",
	caption: "The buttons set `scrollAlign` on the bar below them.",
	note: "A row narrower than its viewport never scrolls and never fires a scroll event, so the widths the alignment maths needs are seeded from layout as well. Without that it would auto-scroll against a content width of zero.",
};

export function Demo(): ReactElement {
	const [align, setAlign] = useState<TabsScrollAlign>("center");

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{TABS_SCROLL_ALIGNS.map((option) => (
					<Button
						key={option}
						onPress={() => setAlign(option)}
						size="sm"
						testID={`few-align-${option}`}
						variant={align === option ? "primary" : "outline"}
					>
						{option}
					</Button>
				))}
			</View>
			<Tabs>
				<Tabs.List>
					<Tabs.ScrollView scrollAlign={align}>
						<Tabs.Indicator />
						<Tabs.Trigger testID="few-all" value="all">
							All
						</Tabs.Trigger>
						<Tabs.Trigger testID="few-unread" value="unread">
							Unread
						</Tabs.Trigger>
					</Tabs.ScrollView>
				</Tabs.List>
			</Tabs>
		</View>
	);
}
