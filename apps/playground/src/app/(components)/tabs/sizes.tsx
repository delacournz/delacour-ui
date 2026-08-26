import { TABS_SIZES, Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

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
export default function TabsSizesGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="One axis, four measurements" title="Sizes">
			{TABS_SIZES.map((size) => (
				<Section key={size} title={size}>
					<View className="flex-row items-start gap-3">
						<View className="flex-1">
							<Tabs size={size}>
								<Tabs.List>
									<Tabs.Indicator />
									{PANELS.map((panel) => (
										<Tabs.Trigger key={panel.value} value={panel.value}>
											{panel.title}
										</Tabs.Trigger>
									))}
								</Tabs.List>
							</Tabs>
						</View>
						{size === "md" ? <View className="h-11 w-1 rounded-full bg-danger" /> : null}
					</View>
				</Section>
			))}

			<Text.Caption color="muted">
				The red rule beside the middle bar is exactly 44pt. The `md` trigger has to reach it, and a unit test asserts
				that from `tokens.css` rather than trusting this page.
			</Text.Caption>

			<Text.Caption color="muted">
				Size drives four things on one axis: the trigger&apos;s floor and padding, the gap ladder — tightest inside a
				trigger, wider between them, widest between the bar and its panels — the label&apos;s `Text` step, and the glyph
				step any composed `Icon` inherits.
			</Text.Caption>

			<Text.Caption color="muted">
				These bars carry no `Tabs.Content` at all, which is a real shape: a filter row driving a list somewhere else.
				With no panels the order comes from the triggers registering themselves instead.
			</Text.Caption>
		</GalleryScreen>
	);
}
