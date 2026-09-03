import { Button } from "delacour-react-native-ui/button";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { DELACOUR_ADAPTIVE_INSET, DELACOUR_CARD_COLOUR, DelacourIcon, DelacourMark } from "@/components/delacour-mark";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const LAUNCHER_SIZES = [120, 76, 60, 40] as const;

const MARK_COLOURS = ["#FBBF24", "#FAFAFA", "#18181B", "#EC4899"] as const;

const SAFE_ZONE = 160;

/**
 * Apple's superellipse radius ratio, close enough for a preview. A number
 * rather than a `rounded-*` class because it scales with the icon it clips, and
 * Tailwind's scanner never compiles a runtime-built arbitrary value.
 */
function squircle(size: number): { borderRadius: number } {
	return { borderRadius: size * 0.2237 };
}

export default function DelacourMarkGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="The app icon, drawn with react-native-svg" title="DelacourMark">
			<Section title="The icon">
				<Text.Caption>
					The same art as assets/icon.png, from the same numbers. Square-cornered on purpose — iOS applies its own mask,
					so clipping is the caller&apos;s job.
				</Text.Caption>
				<View className="flex-row flex-wrap items-end gap-5">
					{LAUNCHER_SIZES.map((size) => (
						<View className="items-center gap-2" key={size}>
							<View className="overflow-hidden" style={squircle(size)}>
								<DelacourIcon size={size} />
							</View>
							<Text.Caption size="xs">{size}pt</Text.Caption>
						</View>
					))}
				</View>
			</Section>

			<Section title="Clipped and unclipped">
				<Text.Caption>Left is what ships; right is what a home screen shows.</Text.Caption>
				<View className="flex-row items-center gap-5">
					<DelacourIcon size={96} />
					<View className="overflow-hidden" style={squircle(96)}>
						<DelacourIcon size={96} />
					</View>
					<View className="overflow-hidden rounded-full">
						<DelacourIcon size={96} />
					</View>
				</View>
			</Section>

			<Section title="The mark alone">
				<Text.Caption>
					No card, transparent, recolourable. Its viewBox is the glyph&apos;s bounding square, so size is the height you
					get rather than a canvas it floats in.
				</Text.Caption>
				<View className="flex-row flex-wrap items-center gap-6">
					{[48, 32, 24, 16].map((size) => (
						<View className="items-center gap-2" key={size}>
							<DelacourMark color="#FBBF24" size={size} />
							<Text.Caption size="xs">{size}pt</Text.Caption>
						</View>
					))}
				</View>
			</Section>

			<Section title="Colour">
				<Text.Caption>
					The same four on a light and a dark surface — a swatch vanishing into one of them is the point.
				</Text.Caption>
				<View className="gap-3">
					<View className="flex-row flex-wrap items-center gap-4 rounded-2xl bg-tertiary p-4">
						{MARK_COLOURS.map((color) => (
							<DelacourMark color={color} key={color} size={40} />
						))}
					</View>
					<View
						className="flex-row flex-wrap items-center gap-4 rounded-2xl p-4"
						style={{ backgroundColor: DELACOUR_CARD_COLOUR }}
					>
						{MARK_COLOURS.map((color) => (
							<DelacourMark color={color} key={color} size={40} />
						))}
					</View>
				</View>
			</Section>

			<Section title="Inline">
				<Text.Caption>
					Beside text and inside a button, where it has to sit on the type&apos;s baseline band.
				</Text.Caption>
				<View className="gap-4">
					<View className="flex-row items-center gap-2">
						<DelacourMark size={20} />
						<Text.Paragraph>Delacour</Text.Paragraph>
					</View>
					<View className="flex-row gap-2">
						<Button>
							<DelacourMark color="#FAFAFA" size={18} />
							<Button.Label>Sign in</Button.Label>
						</Button>
						<Button variant="outline">
							<DelacourMark size={18} />
							<Button.Label>Connect</Button.Label>
						</Button>
					</View>
				</View>
			</Section>

			<Section title="Android safe zone">
				<Text.Caption>
					A launcher shows only the central 72 of an adaptive icon&apos;s 108dp foreground. The circle is that viewport;
					the mark is the {Math.round(DELACOUR_ADAPTIVE_INSET * 100)}% inset the generator bakes into
					android-icon-foreground.png, so nothing can be cropped.
				</Text.Caption>
				<View className="flex-row items-center gap-5">
					<View
						className="items-center justify-center overflow-hidden rounded-full"
						style={{ backgroundColor: DELACOUR_CARD_COLOUR, height: SAFE_ZONE, width: SAFE_ZONE }}
					>
						<DelacourMark size={SAFE_ZONE * DELACOUR_ADAPTIVE_INSET} />
					</View>
					<View
						className="items-center justify-center overflow-hidden"
						style={{
							backgroundColor: DELACOUR_CARD_COLOUR,
							height: SAFE_ZONE,
							width: SAFE_ZONE,
							...squircle(SAFE_ZONE),
						}}
					>
						<DelacourMark size={SAFE_ZONE * DELACOUR_ADAPTIVE_INSET} />
					</View>
				</View>
			</Section>
		</GalleryScreen>
	);
}
