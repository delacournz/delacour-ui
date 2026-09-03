import { Button } from "delacour-react-native-ui/button";
import { TABS_SCROLL_ALIGNS, Tabs, type TabsScrollAlign } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Twelve tabs",
	caption: "The buttons set `scrollAlign` on the bar below them.",
	note: "Swipe the panels rather than tapping, and the bar follows the finger: the auto-scroll interpolates the fractional trigger geometry off the same value the indicator reads, so it tracks the drag instead of jumping once it settles.\n\nScroll the bar by hand while a swipe is settling and the hand wins — and it keeps winning until the bar has actually stopped, not just until the finger lifts. Clearing that flag on release instead would let a retarget fight the momentum of a flick, which reads as the bar snapping backwards.\n\n`none` leaves the bar exactly where it is rather than sending it home, which is the difference that matters for a row the user has already scrolled themselves.",
	capture: { align: "stretch" },
};

const SECTIONS = [
	"Overview",
	"Activity",
	"Members",
	"Billing",
	"Integrations",
	"Notifications",
	"Security",
	"Audit log",
	"Webhooks",
	"API keys",
	"Domains",
	"Danger zone",
] as const;

/**
 * Twelve tabs in a scroller, at every alignment.
 *
 * The two things to watch are the clamps: selecting the first tab must not scroll
 * the row past its own start, and selecting the last must not scroll past its
 * content. Both are the difference between a bar that settles and one that drifts
 * a few points every time you reach an end.
 */
export function Demo(): ReactElement {
	const [align, setAlign] = useState<TabsScrollAlign>("center");
	const [value, setValue] = useState<string>(SECTIONS[0]);

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{TABS_SCROLL_ALIGNS.map((option) => (
					<Button
						key={option}
						onPress={() => setAlign(option)}
						size="sm"
						testID={`align-${option}`}
						variant={align === option ? "primary" : "outline"}
					>
						{option}
					</Button>
				))}
			</View>
			<Tabs onValueChange={setValue} value={value}>
				<Tabs.List>
					<Tabs.ScrollView scrollAlign={align}>
						<Tabs.Indicator />
						{SECTIONS.map((section) => (
							<Tabs.Trigger key={section} testID={`section-${section}`} value={section}>
								{section}
							</Tabs.Trigger>
						))}
					</Tabs.ScrollView>
				</Tabs.List>
				{SECTIONS.map((section) => (
					<Tabs.Content key={section} value={section}>
						<View className="h-24 justify-center rounded-lg bg-secondary px-4">
							<Text.Subheader>{section}</Text.Subheader>
							<Text.Caption color="muted">Panel for {section}.</Text.Caption>
						</View>
					</Tabs.Content>
				))}
			</Tabs>
		</View>
	);
}
