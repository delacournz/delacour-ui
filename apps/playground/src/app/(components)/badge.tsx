import { BADGE_COLORS, BADGE_SIZES, BADGE_VARIANTS, Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconCheckmark1Small, IconHeart, IconStar } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const TAGS = ["React Native", "Reanimated", "Uniwind", "Gesture Handler", "Expo", "Tailwind"] as const;

const SCROLL_CHECK = ["one", "two", "three", "four", "five", "six", "seven", "eight"] as const;

/**
 * Every colour of one variant, on a row that wraps.
 *
 * The grid is built from the exported `as const` arrays rather than written out,
 * so a colour added to `BADGE_COLORS` appears here with no edit.
 */
function VariantRow({ variant }: { variant: (typeof BADGE_VARIANTS)[number] }): ReactElement {
	return (
		<View className="gap-2">
			<Text.Caption color="muted">{variant}</Text.Caption>
			<View className="flex-row flex-wrap gap-2">
				{BADGE_COLORS.map((color) => (
					<Badge color={color} key={color} variant={variant}>
						{color}
					</Badge>
				))}
			</View>
		</View>
	);
}

export default function BadgeGallery(): ReactElement {
	const [tags, setTags] = useState<readonly string[]>(TAGS);
	const [pressCount, setPressCount] = useState(0);
	const [closeCount, setCloseCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);
	const bumpClose = () => setCloseCount((n) => n + 1);
	const remove = (tag: string) => setTags((current) => current.filter((name) => name !== tag));

	return (
		<GalleryScreen subtitle={`Pressed ${pressCount} · dismissed ${closeCount}`} title="Badge">
			<Section title="Variants and colours">
				<View className="gap-4">
					{BADGE_VARIANTS.map((variant) => (
						<VariantRow key={variant} variant={variant} />
					))}
				</View>
			</Section>

			<Section title="Sizes">
				<View className="flex-row flex-wrap items-center gap-2">
					{BADGE_SIZES.map((size) => (
						<Badge color="primary" key={size} size={size}>
							size {size}
						</Badge>
					))}
				</View>
			</Section>

			<Section title="Composed icon">
				<View className="flex-row flex-wrap items-center gap-2">
					{BADGE_SIZES.map((size) => (
						<Badge color="warning" key={size} size={size} variant="soft">
							<Icon icon={IconStar} />
							<Badge.Label>Premium</Badge.Label>
						</Badge>
					))}
				</View>
				<Text.Caption color="muted">
					The glyph is bare. It inherits the badge's icon size and its surface's colour from the root.
				</Text.Caption>
			</Section>

			<Section title="Trailing icon, every variant">
				<View className="flex-row flex-wrap gap-2">
					{BADGE_VARIANTS.map((variant) => (
						<Badge color="success" key={variant} variant={variant}>
							<Badge.Label>Verified</Badge.Label>
							<Icon icon={IconCheckmark1Small} />
						</Badge>
					))}
				</View>
			</Section>

			<Section title="Status dot">
				<View className="flex-row flex-wrap gap-2">
					<Badge color="success" variant="soft">
						<Badge.StartContent>
							<View className="size-1.5 rounded-full bg-success" />
						</Badge.StartContent>
						<Badge.Label>Online</Badge.Label>
					</Badge>
					<Badge color="warning" variant="soft">
						<Badge.StartContent>
							<View className="size-1.5 rounded-full bg-warning" />
						</Badge.StartContent>
						<Badge.Label>Away</Badge.Label>
					</Badge>
					<Badge variant="soft">
						<Badge.StartContent>
							<View className="size-1.5 rounded-full bg-muted-foreground" />
						</Badge.StartContent>
						<Badge.Label>Offline</Badge.Label>
					</Badge>
				</View>
			</Section>

			<Section title="Dismissible">
				<View className="flex-row flex-wrap gap-2">
					{tags.map((tag) => (
						<Badge color="primary" key={tag} onClose={() => remove(tag)} variant="soft">
							{tag}
						</Badge>
					))}
					{tags.length === 0 ? <Text.Caption color="muted">All dismissed.</Text.Caption> : null}
				</View>
				<Text.Caption color="muted">
					The dismiss control is its own pressable. On the "Both" badge below, its tap moves the dismissed counter and
					leaves the pressed counter alone.
				</Text.Caption>
			</Section>

			<Section title="Pressable, and pressable with dismiss">
				<View className="flex-row flex-wrap gap-2">
					<Badge haptic="selection" onPress={bump}>
						Tap me
					</Badge>
					<Badge color="info" haptic="selection" onPress={bump} variant="soft">
						<Icon icon={IconHeart} />
						<Badge.Label>Tap or dismiss</Badge.Label>
					</Badge>
					<Badge color="danger" haptic="selection" onClose={bumpClose} onPress={bump} variant="soft">
						Both
					</Badge>
				</View>
				<Text.Caption color="muted">
					A badge with no press handler renders a plain View and mounts no gesture detector at all.
				</Text.Caption>
			</Section>

			<Section title="Disabled">
				<View className="flex-row flex-wrap gap-2">
					{BADGE_VARIANTS.map((variant) => (
						<Badge color="danger" isDisabled key={variant} onPress={bump} variant={variant}>
							{variant}
						</Badge>
					))}
				</View>
			</Section>

			<Section title="Long label in a narrow column">
				<View className="w-40 gap-2">
					<Badge color="info" variant="soft">
						A deliberately long badge label that has to wrap
					</Badge>
					<Text.Caption color="muted">Sized by its content, so it never stretches to the column.</Text.Caption>
				</View>
			</Section>

			<Section title="Scroll check">
				<View className="flex-row flex-wrap gap-2">
					{SCROLL_CHECK.map((label) => (
						<Badge haptic="selection" key={label} onPress={bump} variant="outline">
							{label}
						</Badge>
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
