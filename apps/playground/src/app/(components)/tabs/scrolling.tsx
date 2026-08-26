import { Button } from "@delacour/native-ui/button";
import { TABS_SCROLL_ALIGNS, Tabs, type TabsScrollAlign } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

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
export default function TabsScrollingGallery(): ReactElement {
	const [align, setAlign] = useState<TabsScrollAlign>("center");
	const [value, setValue] = useState<string>(SECTIONS[0]);

	return (
		<GalleryScreen subtitle={`scrollAlign="${align}"`} title="Scrolling">
			<Section title="Alignment">
				<View className="flex-row flex-wrap gap-2">
					{TABS_SCROLL_ALIGNS.map((option) => (
						<Button
							key={option}
							onPress={() => setAlign(option)}
							size="sm"
							variant={align === option ? "primary" : "outline"}
						>
							{option}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Twelve tabs">
				<Tabs onValueChange={setValue} value={value}>
					<Tabs.List>
						<Tabs.ScrollView scrollAlign={align}>
							<Tabs.Indicator />
							{SECTIONS.map((section) => (
								<Tabs.Trigger key={section} value={section}>
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
			</Section>

			<Text.Caption color="muted">
				Swipe the panels rather than tapping, and the bar follows the finger: the auto-scroll interpolates the
				fractional trigger geometry off the same value the indicator reads, so it tracks the drag instead of jumping
				once it settles.
			</Text.Caption>

			<Text.Caption color="muted">
				Scroll the bar by hand while a swipe is settling and the hand wins — and it keeps winning until the bar has
				actually stopped, not just until the finger lifts. Clearing that flag on release instead would let a retarget
				fight the momentum of a flick, which reads as the bar snapping backwards.
			</Text.Caption>

			<Text.Caption color="muted">
				`none` leaves the bar exactly where it is rather than sending it home, which is the difference that matters for
				a row the user has already scrolled themselves.
			</Text.Caption>

			<Section title="Fewer tabs than room">
				<Tabs>
					<Tabs.List>
						<Tabs.ScrollView scrollAlign={align}>
							<Tabs.Indicator />
							<Tabs.Trigger value="all">All</Tabs.Trigger>
							<Tabs.Trigger value="unread">Unread</Tabs.Trigger>
						</Tabs.ScrollView>
					</Tabs.List>
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				A row narrower than its viewport never scrolls and never fires a scroll event, so the widths the alignment maths
				needs are seeded from layout as well. Without that it would auto-scroll against a content width of zero.
			</Text.Caption>
		</GalleryScreen>
	);
}
