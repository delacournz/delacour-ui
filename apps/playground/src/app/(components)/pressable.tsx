import { Icon } from "@delacour/native-ui/icon";
import { IconHeart } from "@delacour/native-ui/icons/central";
import { PRESSABLE_FEEDBACKS, Pressable } from "@delacour/native-ui/pressable";
import type { ReactElement } from "react";
import { useState } from "react";
import { Text, View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;

const PRESS_STYLES = [
	{ label: "scale only", pressedOpacity: 1, pressedScale: 0.94 },
	{ label: "fade only", pressedOpacity: 0.5, pressedScale: 1 },
	{ label: "both", pressedOpacity: 0.7, pressedScale: 0.97 },
	{ label: "neither", pressedOpacity: 1, pressedScale: 1 },
] as const;

export default function PressableGallery(): ReactElement {
	const [pressCount, setPressCount] = useState(0);
	const [lastEvent, setLastEvent] = useState("none yet");

	const bump = () => setPressCount((n) => n + 1);

	return (
		<GalleryScreen subtitle={`Pressed ${pressCount} times`} title="Pressable">
			<Section title="Named feedback">
				<Text className="text-muted-foreground text-sm">
					The vocabulary every pressable in the library shares. `scale-fade` moves both axes at once, taking each from
					the mode that owns it.
				</Text>
				<View className="gap-3">
					{PRESSABLE_FEEDBACKS.map((feedback) => (
						<Pressable
							className="rounded-xl border border-border bg-card p-4"
							feedback={feedback}
							key={feedback}
							onPress={bump}
						>
							<Text className="font-semibold text-base text-card-foreground">{feedback}</Text>
						</Pressable>
					))}
				</View>
			</Section>

			<Section title="Explicit values">
				<Text className="text-muted-foreground text-sm">
					`pressedScale` and `pressedOpacity` cover what the named modes do not, and each wins on the axis it names. 1
					is the neutral value on either.
				</Text>
				<View className="gap-3">
					{PRESS_STYLES.map((style) => (
						<Pressable
							className="rounded-xl border border-border bg-card p-4"
							key={style.label}
							onPress={bump}
							pressedOpacity={style.pressedOpacity}
							pressedScale={style.pressedScale}
						>
							<Text className="font-semibold text-card-foreground text-base">{style.label}</Text>
							<Text className="text-muted-foreground text-sm">
								scale {style.pressedScale}, opacity {style.pressedOpacity}
							</Text>
						</Pressable>
					))}
				</View>
			</Section>

			<Section title="Haptics">
				<Text className="text-muted-foreground text-sm">
					The haptic fires inside the gesture worklet, so it lands in the same frame as the press.
				</Text>
				<View className="flex-row flex-wrap gap-2">
					{HAPTICS.map((haptic) => (
						<Pressable
							className="rounded-lg bg-tertiary px-3 py-2"
							haptic={haptic}
							key={haptic}
							onPress={() => setLastEvent(`haptic ${haptic}`)}
						>
							<Text className="text-sm text-tertiary-foreground">{haptic}</Text>
						</Pressable>
					))}
				</View>
			</Section>

			<Section title="Long press">
				<Pressable
					className="rounded-xl border border-border bg-card p-4"
					haptic="medium"
					onLongPress={() => setLastEvent("long press")}
					onPress={() => setLastEvent("press")}
				>
					<Text className="font-semibold text-card-foreground text-base">Press or hold</Text>
					<Text className="text-muted-foreground text-sm">Last event: {lastEvent}</Text>
				</Pressable>
			</Section>

			<Section title="Disabled and busy">
				<Text className="text-muted-foreground text-sm">
					Both block the gesture; only `disabled` announces the control as disabled. Neither applies any opacity — that
					is the caller&apos;s job.
				</Text>
				<View className="gap-3">
					<Pressable className="rounded-xl bg-secondary p-4 opacity-50" disabled onPress={bump}>
						<Text className="text-base text-secondary-foreground">disabled</Text>
					</Pressable>
					<Pressable busy className="rounded-xl bg-secondary p-4" onPress={bump}>
						<Text className="text-base text-secondary-foreground">busy</Text>
					</Pressable>
				</View>
			</Section>

			<Section title="asChild">
				<Pressable asChild haptic="medium" onPress={bump}>
					<View className="gap-1 rounded-xl border border-border bg-card p-4">
						<Text className="font-semibold text-card-foreground text-lg">Composed card</Text>
						<Text className="text-muted-foreground text-sm">
							Pressable renders into this View — no extra wrapper in the tree.
						</Text>
					</View>
				</Pressable>
			</Section>

			<Section title="Scroll check">
				<Text className="text-muted-foreground text-sm">
					Drag from anywhere, including on a row, and the list should scroll rather than the row swallowing the gesture.
				</Text>
				<View className="gap-3">
					{Array.from({ length: 8 }, (_, i) => (
						<Pressable
							className="flex-row items-center gap-3 rounded-xl bg-secondary px-4 py-3"
							haptic="selection"
							key={i}
							onPress={bump}
						>
							<Icon color="secondary-foreground" icon={IconHeart} size={18} />
							<Text className="text-base text-secondary-foreground">Row {i + 1}</Text>
						</Pressable>
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
