import { Badge } from "@delacour/react-native-ui/badge";
import { useThemeColor } from "@delacour/react-native-ui/hooks/use-theme-color";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconArrowUpRight } from "@delacour/react-native-ui/icons/central";
import { transparentOf } from "@delacour/react-native-ui/lib/color";
import { Pressable } from "@delacour/react-native-ui/pressable";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { Canvas, RadialGradient, Rect, vec } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import type { GlowCorner, HubCard as HubCardEntry } from "@/lib/hub-cards";

type Size = { width: number; height: number };

/**
 * A soft radial bloom from one corner, in a theme colour.
 *
 * Skia rather than an image so it follows the active theme and light/dark: the
 * colour is read with `useThemeColor` and faded to itself at zero alpha with
 * `transparentOf`, never to the keyword `transparent`, which would drag the
 * bloom through grey. Nothing is drawn until the card has been measured, nor
 * when the colour cannot be taken apart.
 */
function Glow({
	token,
	corner,
	opacity,
	size,
}: {
	token: string;
	corner: GlowCorner;
	opacity: number;
	size: Size;
}): ReactElement | null {
	const color = useThemeColor(token);
	const faded = transparentOf(color);

	if (!(color && faded) || size.width === 0) return null;

	const center = corner === "top-left" ? vec(0, 0) : vec(size.width, size.height);
	const radius = Math.max(size.width, size.height) * 0.95;

	return (
		<Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Rect height={size.height} opacity={opacity} width={size.width} x={0} y={0}>
				<RadialGradient c={center} colors={[color, faded]} r={radius} />
			</Rect>
		</Canvas>
	);
}

/**
 * One of the hub's two doors: a full-width etched panel with a count pill at
 * the top, the title and a line under it at the bottom, and an outbound arrow
 * in the bottom corner.
 *
 * Playground chrome, not a library component. The whole card is the target, so
 * the arrow is a glyph in a disc rather than a second button; the card is
 * announced as one button whose label carries the count.
 */
export function HubCard({ card }: { card: HubCardEntry }): ReactElement {
	const router = useRouter();
	const [size, setSize] = useState<Size>({ width: 0, height: 0 });

	const onLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setSize({ width, height });
	};

	return (
		<Pressable
			accessibilityHint={card.description}
			accessibilityLabel={`${card.title}, ${card.count} total`}
			accessibilityRole="button"
			feedback="scale"
			haptic="selection"
			onPress={() => router.push(card.href)}
			testID={`hub-${card.slug}`}
		>
			<Surface className="min-h-56 overflow-hidden rounded-3xl p-0" material="etched" onLayout={onLayout}>
				<Glow corner={card.glow.corner} opacity={card.glow.opacity} size={size} token={card.glow.token} />
				<View className="flex-1 justify-between gap-12 p-5">
					<View className="flex-row">
						<Badge material="etched" size="sm" variant="soft">{`${card.count} total`}</Badge>
					</View>
					<View className="flex-row items-end gap-4">
						<View className="min-w-0 flex-1 gap-1">
							<Text.Title className="font-heading">{card.title}</Text.Title>
							<Text.Caption>{card.description}</Text.Caption>
						</View>
						<View className="size-11 items-center justify-center rounded-full bg-muted">
							<Icon icon={IconArrowUpRight} />
						</View>
					</View>
				</View>
			</Surface>
		</Pressable>
	);
}
