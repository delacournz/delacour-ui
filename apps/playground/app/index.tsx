import {
	BUTTON_SIZES,
	BUTTON_SPINNER_PLACEMENTS,
	BUTTON_VARIANTS,
	Button,
	type ButtonSpinnerPlacement,
} from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import {
	IconArrowRight,
	IconArrowsRepeatCircle,
	IconHeart,
	IconPlusMedium,
	IconTrashCan,
} from "@delacour/native-ui/icons/central";
import { Pressable } from "@delacour/native-ui/pressable";
import { SPINNER_COLORS, SPINNER_SIZES, Spinner } from "@delacour/native-ui/spinner";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;
const FEEDBACKS = ["scale", "none"] as const;

/**
 * A loading flag that switches itself back off.
 *
 * The interesting part of `isLoading` is the transition in *and* out — a flag
 * that stays on only ever exercises half of it.
 */
function useTransientLoading(durationMs = 2500): [boolean, () => void] {
	const [isLoading, setIsLoading] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[]
	);

	const start = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		setIsLoading(true);
		timer.current = setTimeout(() => setIsLoading(false), durationMs);
	}, [durationMs]);

	return [isLoading, start];
}

function LoadingButton({
	spinnerPlacement,
	isDimmedWhileLoading = false,
	variant = "primary",
	label,
}: {
	spinnerPlacement: ButtonSpinnerPlacement;
	isDimmedWhileLoading?: boolean;
	variant?: (typeof BUTTON_VARIANTS)[number];
	label: string;
}) {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button
			isDimmedWhileLoading={isDimmedWhileLoading}
			isLoading={isLoading}
			onPress={start}
			spinnerPlacement={spinnerPlacement}
			variant={variant}
		>
			{label}
		</Button>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View className="gap-3">
			<Text className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{title}</Text>
			{children}
		</View>
	);
}

function SizedLoadingButton({ size }: { size: (typeof BUTTON_SIZES)[number] }) {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button isLoading={isLoading} onPress={start} size={size}>
			<Icon icon={IconPlusMedium} />
			<Button.Label>size {size}</Button.Label>
		</Button>
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

			<Section title="Spinner sizes">
				<View className="flex-row items-center gap-6">
					{SPINNER_SIZES.map((size) => (
						<View className="items-center gap-2" key={size}>
							<Spinner size={size} />
							<Text className="text-muted-foreground text-xs">{size}</Text>
						</View>
					))}
					<View className="items-center gap-2">
						<Spinner size={40} />
						<Text className="text-muted-foreground text-xs">40pt</Text>
					</View>
				</View>
			</Section>

			<Section title="Spinner colours">
				<Text className="text-muted-foreground text-sm">
					Named colours, a theme token and a literal hex. All four should survive a theme switch.
				</Text>
				<View className="flex-row flex-wrap items-center gap-6">
					{SPINNER_COLORS.map((color) => (
						<View className="items-center gap-2" key={color}>
							<Spinner color={color} size="lg" />
							<Text className="text-muted-foreground text-xs">{color}</Text>
						</View>
					))}
					<View className="items-center gap-2">
						<Spinner color="info" size="lg" />
						<Text className="text-muted-foreground text-xs">info</Text>
					</View>
					<View className="items-center gap-2">
						<Spinner color="#EC4899" size="lg" />
						<Text className="text-muted-foreground text-xs">#EC4899</Text>
					</View>
				</View>
			</Section>

			<Section title="Spinner custom glyph">
				<Text className="text-muted-foreground text-sm">
					A bare child is wrapped automatically so it still rotates. `Spinner.Content` sets the speed.
				</Text>
				<View className="flex-row items-center gap-6">
					<View className="items-center gap-2">
						<Spinner color="danger" size="lg">
							<Icon icon={IconArrowsRepeatCircle} />
						</Spinner>
						<Text className="text-muted-foreground text-xs">bare child</Text>
					</View>
					<View className="items-center gap-2">
						<Spinner color="warning" size="lg">
							<Spinner.Content speed={0.4}>
								<Icon icon={IconArrowsRepeatCircle} />
							</Spinner.Content>
						</Spinner>
						<Text className="text-muted-foreground text-xs">speed 0.4</Text>
					</View>
					<View className="items-center gap-2">
						<Spinner size="lg">
							<Spinner.Content speed={2.5} />
						</Spinner>
						<Text className="text-muted-foreground text-xs">speed 2.5</Text>
					</View>
				</View>
			</Section>

			<Section title="Button loading, every variant">
				<Text className="text-muted-foreground text-sm">
					Nothing is passed to the spinner — it reads the button&apos;s variant and size from context.
				</Text>
				<View className="gap-3">
					{BUTTON_VARIANTS.map((variant) => (
						<LoadingButton key={variant} label={variant} spinnerPlacement="start" variant={variant} />
					))}
				</View>
			</Section>

			<Section title="Button loading, every size">
				<View className="gap-3">
					{BUTTON_SIZES.map((size) => (
						<SizedLoadingButton key={size} size={size} />
					))}
				</View>
			</Section>

			<Section title="Spinner placement">
				<View className="gap-3">
					{BUTTON_SPINNER_PLACEMENTS.map((placement) => (
						<LoadingButton key={placement} label={`placement ${placement}`} spinnerPlacement={placement} />
					))}
				</View>
			</Section>

			<Section title="Loading and dimming">
				<Text className="text-muted-foreground text-sm">
					Loading blocks the press but keeps full contrast. `isDimmedWhileLoading` fades it like `isDisabled`.
				</Text>
				<View className="gap-3">
					<LoadingButton label="full contrast" spinnerPlacement="start" variant="secondary" />
					<LoadingButton isDimmedWhileLoading label="dimmed" spinnerPlacement="start" variant="secondary" />
				</View>
			</Section>

			<Section title="Loading in a row">
				<Text className="text-muted-foreground text-sm">
					Not full width, so the width snaps when the spinner appears. Deliberately un-animated.
				</Text>
				<View className="flex-row flex-wrap items-center gap-3">
					<LoadingButton label="Save" spinnerPlacement="start" />
					<LoadingButton label="Sync" spinnerPlacement="end" variant="outline" />
					<LoadingButton label="Delete" spinnerPlacement="only" variant="danger" />
				</View>
			</Section>

			<Section title="Spinner overrides the button">
				<Text className="text-muted-foreground text-sm">
					An explicit colour on a composed spinner still wins over the button&apos;s context.
				</Text>
				<Button onPress={bump} variant="primary">
					<Spinner color="#EC4899" />
					<Button.Label>Explicit pink</Button.Label>
				</Button>
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
