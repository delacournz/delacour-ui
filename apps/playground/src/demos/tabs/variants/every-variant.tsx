import { TABS_VARIANTS, Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Every variant",
	note: "`primary` is a muted track with a fully rounded capsule sliding under the active label; `secondary` drops the track for an underline. Both the track and the capsule are `rounded-full`, so the capsule sits concentric inside the track at any padding — a pill inside a pill always does, which is why there is no radius arithmetic anywhere in this component.\n\nThe capsule is painted on `elevated`, a surface that sits above `muted` in *both* themes. `card` cannot do that job: it is the same white as the background in light and darker than `muted` in dark, so a capsule on it reads as raised in one theme and sunken in the other.\n\nDrag any of them sideways. The capsule tracks the finger and the panel comes with it, because both read the same shared value rather than each running a clock of their own.\n\nDrag slowly and watch the labels: they crossfade between the two colours rather than flipping at the midpoint, because the colour interpolates off that same value. A tap fades too — the settle spring writes the value the label reads, so there is no second path to keep in step.",
	capture: { align: "stretch", hero: true },
};

const PANELS = [
	{ body: "Everything at a glance.", title: "Overview", value: "overview" },
	{ body: "What changed, and when.", title: "Activity", value: "activity" },
	{ body: "Nothing here is saved.", title: "Settings", value: "settings" },
] as const;

/**
 * One bar per variant, on the same three tabs.
 *
 * The panels carry a fixed height so the bars stay level down the demo —
 * without one, each pager takes the height of its own tallest panel and they
 * drift apart as you switch tabs.
 */
export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{TABS_VARIANTS.map((variant) => (
				<View className="gap-2" key={variant}>
					<Text.Caption size="xs">{variant}</Text.Caption>
					<Tabs variant={variant}>
						<Tabs.List>
							<Tabs.Indicator />
							{PANELS.map((panel) => (
								<Tabs.Trigger key={panel.value} testID={`${variant}-${panel.value}`} value={panel.value}>
									{panel.title}
								</Tabs.Trigger>
							))}
						</Tabs.List>
						{PANELS.map((panel) => (
							<Tabs.Content key={panel.value} value={panel.value}>
								<View className="h-16 justify-center rounded-lg bg-secondary px-4">
									<Text.Paragraph>{panel.body}</Text.Paragraph>
								</View>
							</Tabs.Content>
						))}
					</Tabs>
				</View>
			))}
		</View>
	);
}
