import { BUTTON_SIZES, BUTTON_VARIANTS, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconHeart, IconPlusMedium, IconTrashCan } from "@delacour/native-ui/icons/central";
import { Pressable } from "@delacour/native-ui/pressable";
import type { ReactNode } from "react";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;
const FEEDBACKS = ["scale", "none"] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View className="gap-3">
			<Text className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{title}</Text>
			{children}
		</View>
	);
}

/**
 * Component gallery for @delacour/native-ui.
 *
 * Deliberately a ScrollView: it exercises the tap-versus-scroll gesture
 * conflict, which a static screen would not catch.
 */
export default function Index() {
	const insets = useSafeAreaInsets();
	const { theme, hasAdaptiveThemes } = useUniwind();
	const [pressCount, setPressCount] = useState(0);

	const activeTheme = hasAdaptiveThemes ? "system" : theme;
	const bump = () => setPressCount((n) => n + 1);

	return (
		<ScrollView
			className="flex-1 bg-background"
			contentContainerClassName="gap-8 p-5"
			contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top + 16 }}
		>
			<View className="gap-1">
				<Text className="font-bold text-3xl text-foreground">native-ui</Text>
				<Text className="text-base text-muted-foreground">Pressed {pressCount} times</Text>
			</View>

			<Section title="Theme">
				<View className="flex-row gap-2">
					{(["light", "dark", "system"] as const).map((name) => (
						<Button
							key={name}
							onPress={() => Uniwind.setTheme(name)}
							size="sm"
							variant={activeTheme === name ? "primary" : "outline"}
						>
							{name}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Variants">
				<View className="gap-3">
					{BUTTON_VARIANTS.map((variant) => (
						<Button key={variant} onPress={bump} variant={variant}>
							{variant}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<View className="gap-3">
					{BUTTON_SIZES.map((size) => (
						<Button key={size} onPress={bump} size={size}>
							size {size}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Start icon">
				<View className="gap-3">
					{BUTTON_SIZES.map((size) => (
						<Button key={size} onPress={bump} size={size}>
							<Icon icon={IconPlusMedium} />
							<Button.Label>Add item</Button.Label>
						</Button>
					))}
				</View>
			</Section>

			<Section title="End icon">
				<Button onPress={bump}>
					<Button.Label>Continue</Button.Label>
					<Icon icon={IconArrowRight} />
				</Button>
			</Section>

			<Section title="Both icons, every variant">
				<View className="gap-3">
					{BUTTON_VARIANTS.map((variant) => (
						<Button key={variant} onPress={bump} variant={variant}>
							<Icon icon={IconHeart} />
							<Button.Label>{variant}</Button.Label>
							<Icon icon={IconArrowRight} />
						</Button>
					))}
				</View>
			</Section>

			<Section title="Icon only">
				<View className="flex-row items-center gap-3">
					{BUTTON_SIZES.map((size) => (
						<Button accessibilityLabel={`Favourite ${size}`} isIconOnly key={size} onPress={bump} size={size}>
							<Icon icon={IconHeart} />
						</Button>
					))}
					<Button accessibilityLabel="Delete" isIconOnly onPress={bump} variant="danger-soft">
						<Icon icon={IconTrashCan} />
					</Button>
					<Button accessibilityLabel="Add" isIconOnly onPress={bump} variant="outline">
						<Icon icon={IconPlusMedium} />
					</Button>
				</View>
			</Section>

			<Section title="Disabled">
				<View className="gap-3">
					<Button isDisabled onPress={bump}>
						<Icon icon={IconPlusMedium} />
						<Button.Label>Cannot press this</Button.Label>
					</Button>
					<Button isDisabled onPress={bump} variant="outline">
						Disabled outline
					</Button>
				</View>
			</Section>

			<Section title="Feedback">
				<Text className="text-muted-foreground text-sm">
					`scale` springs the button down on press; `none` disables the animation entirely.
				</Text>
				<View className="gap-3">
					{FEEDBACKS.map((feedback) => (
						<Button feedback={feedback} key={feedback} onPress={bump} variant="secondary">
							{feedback}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Haptics">
				<View className="flex-row flex-wrap gap-2">
					{HAPTICS.map((haptic) => (
						<Button haptic={haptic} key={haptic} size="sm" variant="tertiary">
							{haptic}
						</Button>
					))}
				</View>
			</Section>

			<Section title="Compound parts">
				<Button onPress={bump} variant="outline">
					<Button.StartContent>
						<Icon color="danger" icon={IconHeart} size={18} />
					</Button.StartContent>
					<Button.Label className="text-danger">Custom label colour</Button.Label>
					<Button.EndContent>
						<Icon color="muted-foreground" icon={IconArrowRight} size={18} />
					</Button.EndContent>
				</Button>
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
					Drag from anywhere, including on a button, and the list should scroll rather than the button swallowing the
					gesture.
				</Text>
				<View className="gap-3">
					{Array.from({ length: 8 }, (_, i) => (
						<Button haptic="selection" key={i} onPress={bump} variant="secondary">
							<Icon icon={IconPlusMedium} />
							<Button.Label>Row {i + 1}</Button.Label>
						</Button>
					))}
				</View>
			</Section>
		</ScrollView>
	);
}
