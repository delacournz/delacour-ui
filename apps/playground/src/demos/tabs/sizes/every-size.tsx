import { TABS_SIZES, Tabs } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Every size",
	note: "The red rule beside the middle bar is exactly 44pt. The `md` trigger has to reach it, and a unit test asserts that from `tokens.css` rather than trusting this page.\n\nSize drives four things on one axis: the trigger's floor and padding, the gap ladder — tightest inside a trigger, wider between them, widest between the bar and its panels — the label's `Text` step, and the glyph step any composed `Icon` inherits.\n\nThese bars carry no `Tabs.Content` at all, which is a real shape: a filter row driving a list somewhere else. With no panels the order comes from the triggers registering themselves instead.",
	capture: { align: "stretch" },
};

const PANELS = [
	{ title: "Day", value: "day" },
	{ title: "Week", value: "week" },
	{ title: "Month", value: "month" },
] as const;

/**
 * One bar per size, with a 44pt rule drawn beside the default one.
 *
 * The rule is the check that matters here: `md`'s trigger floor has to clear the
 * platform hit target, and it is a floor rather than a height so a large
 * accessibility text step grows the row instead of clipping the label.
 */
export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{TABS_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption size="xs">{size}</Text.Caption>
					<View className="flex-row items-start gap-3">
						<View className="flex-1">
							<Tabs size={size}>
								<Tabs.List>
									<Tabs.Indicator />
									{PANELS.map((panel) => (
										<Tabs.Trigger key={panel.value} testID={`${size}-${panel.value}`} value={panel.value}>
											{panel.title}
										</Tabs.Trigger>
									))}
								</Tabs.List>
							</Tabs>
						</View>
						{size === "md" ? <View className="h-11 w-1 rounded-full bg-destructive" /> : null}
					</View>
				</View>
			))}
		</View>
	);
}
