import { Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconBell, IconUser } from "@delacour/native-ui/icons/central";
import { Tabs, useTabsMotion } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

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

/** The whole compound surface on one page. */
export default function TabsCompositionGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="Every part, and two nested gestures" title="Composition">
			<Section title="Separators">
				<Tabs variant="secondary">
					<Tabs.List>
						<Tabs.Indicator />
						<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
						<Tabs.Separator betweenValues={["overview", "activity"]} />
						<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
						<Tabs.Separator betweenValues={["activity", "settings"]} />
						<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="overview">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Everything at a glance.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="activity">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>What changed, and when.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="settings">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Nothing here is saved.</Text.Paragraph>
						</View>
					</Tabs.Content>
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				Every rule is present at rest. Drag sideways and the one the capsule is crossing dips out and comes back — it
				reads the pager&apos;s position, not the settled value, so it fades under the finger and returns if the drag is
				abandoned. The fade means one thing: the indicator is on top of this rule right now.
			</Text.Caption>

			<Text.Caption color="muted">
				A faded rule still takes its width, so the row never reflows while the fade runs. That does make a bar wider —
				enough to tip a row that only just fits into one that scrolls, at which point `scrollAlign` starts moving it for
				no reason a reader can see. This one has room, so it takes no `Tabs.ScrollView`.
			</Text.Caption>

			<Section title="Composed icons and a render prop">
				<Tabs variant="secondary">
					<Tabs.List>
						<Tabs.Indicator />
						<Tabs.Trigger value="alerts">
							{({ isSelected }) => (
								<>
									<Icon icon={IconBell} />
									<Tabs.Label>Alerts</Tabs.Label>
									<Badge color="danger" size="sm" variant={isSelected ? "solid" : "soft"}>
										3
									</Badge>
								</>
							)}
						</Tabs.Trigger>
						<Tabs.Trigger value="profile">
							<Icon icon={IconUser} />
							<Tabs.Label>Profile</Tabs.Label>
						</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="alerts">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Three unread alerts.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="profile">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Your profile.</Text.Paragraph>
						</View>
					</Tabs.Content>
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				Two tabs rather than three, because a non-scrolling bar splits its width evenly and an icon, a label and a badge
				do not fit in a third of this screen — the labels truncate. That is the trade a bar without a `Tabs.ScrollView`
				makes: every tab gets equal room, whether or not it needs it.
			</Text.Caption>

			<Text.Caption color="muted">
				The glyphs are composed, never passed as props: the trigger publishes its size step and its variant&apos;s
				foreground, so a bare `Icon` comes out right with nothing said here. The badge switches `variant` through the
				render prop, which is the escape hatch for anything a class cannot express.
			</Text.Caption>

			<Text.Caption color="muted">
				Note what the render prop does *not* do: it never adds or removes content. A badge that appeared only when
				selected would change that trigger&apos;s width, and a trigger&apos;s width is the indicator&apos;s geometry —
				the bar would re-measure and shift on every tab change. Swap a treatment, not a size.
			</Text.Caption>

			<Text.Caption color="muted">
				The glyph still steps at the midpoint while the label beside it fades: an `Icon` takes its colour as a resolved
				value rather than a style, so it has no way to be half way between two.
			</Text.Caption>

			<Section title="A restyled indicator, and a disabled tab">
				<Tabs variant="primary">
					<Tabs.List>
						<Tabs.Indicator className="border border-primary bg-transparent" />
						<Tabs.Trigger value="live">Live</Tabs.Trigger>
						<Tabs.Trigger value="draft">Draft</Tabs.Trigger>
						<Tabs.Trigger isDisabled value="archived">
							Archived
						</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="live">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Live.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="draft">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Draft.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="archived">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Archived.</Text.Paragraph>
						</View>
					</Tabs.Content>
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				The capsule keeps its measured position and its spring; only its paint changed, and it changed through a
				`className` that merges after the variant&apos;s own fill. Children go *inside* the capsule rather than
				replacing it — `Radio.Indicator` keeps its ring the same way — so an outline is a class, not a child.
			</Text.Caption>

			<Text.Caption color="muted">
				A variant pairs its fill with a label colour that has to read against it, so emptying the capsule takes the
				label with it — `primary`&apos;s selected label is `elevated-foreground`, the content colour for the surface the
				capsule is painted on. Against a transparent capsule that still reads here, but a fill and its foreground are
				one decision.
			</Text.Caption>

			<Text.Caption color="muted">
				The disabled tab must actually look faded. At full contrast the fade landed on the pressable&apos;s own animated
				node, which overwrites opacity every frame.
			</Text.Caption>

			<Section title="A scroller inside a panel">
				<Tabs>
					<Tabs.List>
						<Tabs.Indicator />
						<Tabs.Trigger value="cards">Cards</Tabs.Trigger>
						<Tabs.Trigger value="plain">Plain</Tabs.Trigger>
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
			</Section>

			<Text.Caption color="muted">
				Drag the cards and the strip scrolls; drag the panel beside them and the pager changes tab. A vertical drag
				anywhere still scrolls this page — the pager gives up on vertical movement rather than negotiating for it, which
				is what lets it live inside a scrolling screen at all.
			</Text.Caption>
		</GalleryScreen>
	);
}
