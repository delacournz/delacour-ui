import { Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconBell, IconSettingsGear1, IconUser } from "@delacour/native-ui/icons/central";
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
			<Section title="Separators, icons and a render prop">
				<Tabs variant="secondary">
					<Tabs.List>
						<Tabs.ScrollView>
							<Tabs.Indicator />
							<Tabs.Trigger value="profile">
								<Icon icon={IconUser} />
								<Tabs.Label>Profile</Tabs.Label>
							</Tabs.Trigger>
							<Tabs.Separator betweenValues={["profile", "alerts"]} />
							<Tabs.Trigger value="alerts">
								{({ isSelected }) => (
									<>
										<Icon icon={IconBell} />
										<Tabs.Label>Alerts</Tabs.Label>
										{isSelected ? (
											<Badge color="danger" size="sm" variant="solid">
												3
											</Badge>
										) : null}
									</>
								)}
							</Tabs.Trigger>
							<Tabs.Separator betweenValues={["alerts", "settings"]} />
							<Tabs.Trigger value="settings">
								<Icon icon={IconSettingsGear1} />
								<Tabs.Label>Settings</Tabs.Label>
							</Tabs.Trigger>
						</Tabs.ScrollView>
					</Tabs.List>
					<Tabs.Content value="profile">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Your profile.</Text.Paragraph>
						</View>
					</Tabs.Content>
					<Tabs.Content value="alerts">
						<View className="h-20 justify-center rounded-lg bg-secondary px-4">
							<Text.Paragraph>Three unread alerts.</Text.Paragraph>
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
				The rules between the tabs retreat as the indicator approaches and come back if a drag is abandoned — they read
				the pager&apos;s position, not the settled value, so they fade with the finger rather than blinking away at
				release.
			</Text.Caption>

			<Text.Caption color="muted">
				The glyphs are composed, never passed as props: the trigger publishes its size step and its variant&apos;s
				foreground, so a bare `Icon` comes out right with nothing said here. The badge appears through the render prop,
				which is the escape hatch for anything a class cannot express.
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
