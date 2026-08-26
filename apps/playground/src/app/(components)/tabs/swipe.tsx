import { Button } from "@delacour/native-ui/button";
import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const PANELS = [
	{ tone: "bg-success-soft", value: "one" },
	{ tone: "bg-warning-soft", value: "two" },
	{ tone: "bg-info-soft", value: "three" },
] as const;

function Panel({ label, tone }: { label: string; tone: string }): ReactElement {
	return (
		<View className={`h-28 items-center justify-center rounded-lg ${tone}`}>
			<Text.Header>{label}</Text.Header>
		</View>
	);
}

/**
 * The gesture, and the two paths that only exist because of it.
 *
 * Deliberately inside a `GalleryScreen`, which is a `Screen.ScrollArea` — the
 * whole point is that a horizontal pan and a vertical scroll share this page and
 * neither steals the other's drag.
 */
export default function TabsSwipeGallery(): ReactElement {
	const [rejected, setRejected] = useState("one");
	const attempts = useRef(0);

	// Accepts two changes in three. A controlled parent that ignores a change
	// re-renders nothing, so this is the case a reconcile keyed only on the
	// parent's commit would never run for — the pager would sit on a panel the
	// caller's state says is not selected.
	const handleRejecting = useCallback((next: string) => {
		attempts.current += 1;
		if (attempts.current % 3 === 0) return;
		setRejected(next);
	}, []);

	const [ordered, setOrdered] = useState(["b", "c"]);
	const [insertedValue, setInsertedValue] = useState("b");
	const prependTab = useCallback(() => {
		setOrdered((current) => [`a${current.length}`, ...current]);
	}, []);

	return (
		<GalleryScreen subtitle="Pan, fling, rubber band" title="Swipe">
			<Section title="Swipeable — the default">
				<Tabs>
					<Tabs.List>
						<Tabs.Indicator />
						{PANELS.map((panel) => (
							<Tabs.Trigger key={panel.value} value={panel.value}>
								{panel.value}
							</Tabs.Trigger>
						))}
					</Tabs.List>
					{PANELS.map((panel) => (
						<Tabs.Content key={panel.value} value={panel.value}>
							<Panel label={panel.value} tone={panel.tone} />
						</Tabs.Content>
					))}
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				Drag slowly: the capsule tracks the finger rather than snapping at release. Let go before the halfway point and
				it returns. Flick hard across two panels and it still lands exactly one away — a flick is an instruction, not a
				licence to skip. Drag past the last panel and it resists rather than stopping dead.
			</Text.Caption>

			<Section title="isSwipeable={false}">
				<Tabs isSwipeable={false} variant="secondary">
					<Tabs.List>
						<Tabs.Indicator />
						{PANELS.map((panel) => (
							<Tabs.Trigger key={panel.value} value={panel.value}>
								{panel.value}
							</Tabs.Trigger>
						))}
					</Tabs.List>
					{PANELS.map((panel) => (
						<Tabs.Content key={panel.value} value={panel.value}>
							<Panel label={panel.value} tone={panel.tone} />
						</Tabs.Content>
					))}
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				One `.enabled(false)` on the pan, and nothing else in the component branches on it. Presses animate exactly as
				they do above, and every panel is still mounted — you cannot drag to a panel that is not there, so mounting is
				not something this prop gets to change as a side effect.
			</Text.Caption>

			<Section title="Controlled, rejecting every third change">
				<Tabs onValueChange={handleRejecting} value={rejected}>
					<Tabs.List>
						<Tabs.Indicator />
						{PANELS.map((panel) => (
							<Tabs.Trigger key={panel.value} value={panel.value}>
								{panel.value}
							</Tabs.Trigger>
						))}
					</Tabs.List>
					{PANELS.map((panel) => (
						<Tabs.Content key={panel.value} value={panel.value}>
							<Panel label={panel.value} tone={panel.tone} />
						</Tabs.Content>
					))}
				</Tabs>
			</Section>

			<Text.Caption color="muted">
				Every third press or swipe is refused. A refused press must not animate at all; a refused swipe has to spring
				back, because the finger already moved the pager. An accepted swipe keeps the momentum it was thrown with, which
				is the case that breaks if the reconcile is not told where the gesture already aimed.
			</Text.Caption>

			<Section title="A tab inserted before the active one">
				<View className="gap-3">
					<Button onPress={prependTab} size="sm" variant="outline">
						Add a tab at the front
					</Button>
					<Tabs onValueChange={setInsertedValue} value={insertedValue}>
						<Tabs.List>
							<Tabs.ScrollView>
								<Tabs.Indicator />
								{ordered.map((value) => (
									<Tabs.Trigger key={value} value={value}>
										{value}
									</Tabs.Trigger>
								))}
							</Tabs.ScrollView>
						</Tabs.List>
						{ordered.map((value) => (
							<Tabs.Content key={value} value={value}>
								<Panel label={value} tone="bg-tertiary" />
							</Tabs.Content>
						))}
					</Tabs>
				</View>
			</Section>

			<Text.Caption color="muted">
				The selected tab does not change — its index does, because the list grew to its left. The pager has to jump
				rather than spring: sliding sideways here would be animating an edit the user did not make.
			</Text.Caption>
		</GalleryScreen>
	);
}
