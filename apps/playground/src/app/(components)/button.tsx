import {
	BUTTON_SIZES,
	BUTTON_SPINNER_PLACEMENTS,
	BUTTON_VARIANTS,
	Button,
	type ButtonSpinnerPlacement,
	type ButtonVariant,
} from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconHeart, IconPlusMedium, IconTrashCan } from "@delacour/native-ui/icons/central";
import { Spinner } from "@delacour/native-ui/spinner";
import type { ReactElement } from "react";
import { useState } from "react";
import { Text, View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";
import { useTransientLoading } from "@/hooks/use-transient-loading";

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;
const FEEDBACKS = ["scale", "none"] as const;

function LoadingButton({
	spinnerPlacement,
	isDimmedWhileLoading = false,
	variant = "primary",
	label,
}: {
	spinnerPlacement: ButtonSpinnerPlacement;
	isDimmedWhileLoading?: boolean;
	variant?: ButtonVariant;
	label: string;
}): ReactElement {
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

function SizedLoadingButton({ size }: { size: (typeof BUTTON_SIZES)[number] }): ReactElement {
	const [isLoading, start] = useTransientLoading();

	return (
		<Button isLoading={isLoading} onPress={start} size={size}>
			<Icon icon={IconPlusMedium} />
			<Button.Label>size {size}</Button.Label>
		</Button>
	);
}

export default function ButtonGallery(): ReactElement {
	const [pressCount, setPressCount] = useState(0);
	const bump = () => setPressCount((n) => n + 1);

	return (
		<GalleryScreen subtitle={`Pressed ${pressCount} times`} title="Button">
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

			<Section title="Loading, every variant">
				<Text className="text-muted-foreground text-sm">
					Nothing is passed to the spinner — it reads the button&apos;s variant and size from context.
				</Text>
				<View className="gap-3">
					{BUTTON_VARIANTS.map((variant) => (
						<LoadingButton key={variant} label={variant} spinnerPlacement="start" variant={variant} />
					))}
				</View>
			</Section>

			<Section title="Loading, every size">
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
		</GalleryScreen>
	);
}
