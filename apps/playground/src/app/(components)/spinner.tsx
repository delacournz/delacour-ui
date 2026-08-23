import { Icon } from "@delacour/native-ui/icon";
import { IconArrowsRepeatCircle } from "@delacour/native-ui/icons/central";
import { SPINNER_COLORS, SPINNER_SIZES, Spinner } from "@delacour/native-ui/spinner";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

export default function SpinnerGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="Named sizes are shared with Icon" title="Spinner">
			<Section title="Sizes">
				<View className="flex-row flex-wrap items-center gap-6">
					{SPINNER_SIZES.map((size) => (
						<View className="items-center gap-2" key={size}>
							<Spinner size={size} />
							<Text.Caption size="xs">{size}</Text.Caption>
						</View>
					))}
					<View className="items-center gap-2">
						<Spinner size={40} />
						<Text.Caption size="xs">40pt</Text.Caption>
					</View>
				</View>
			</Section>

			<Section title="Colours">
				<Text.Caption>
					Named colours, a theme token and a literal hex. All four should survive a theme switch.
				</Text.Caption>
				<View className="flex-row flex-wrap items-center gap-6">
					{SPINNER_COLORS.map((color) => (
						<View className="items-center gap-2" key={color}>
							<Spinner color={color} size="lg" />
							<Text.Caption size="xs">{color}</Text.Caption>
						</View>
					))}
					<View className="items-center gap-2">
						<Spinner color="info" size="lg" />
						<Text.Caption size="xs">info</Text.Caption>
					</View>
					<View className="items-center gap-2">
						<Spinner color="#EC4899" size="lg" />
						<Text.Caption size="xs">#EC4899</Text.Caption>
					</View>
				</View>
			</Section>

			<Section title="Custom glyph">
				<Text.Caption>A bare child is wrapped automatically so it still rotates. `speed` sets the rate.</Text.Caption>
				<View className="flex-row items-center gap-6">
					<View className="items-center gap-2">
						<Spinner color="danger" size="lg">
							<Icon icon={IconArrowsRepeatCircle} />
						</Spinner>
						<Text.Caption size="xs">bare child</Text.Caption>
					</View>
					<View className="items-center gap-2">
						<Spinner color="warning" size="lg" speed={0.4}>
							<Icon icon={IconArrowsRepeatCircle} />
						</Spinner>
						<Text.Caption size="xs">speed 0.4</Text.Caption>
					</View>
					<View className="items-center gap-2">
						<Spinner size="lg" speed={2.5} />
						<Text.Caption size="xs">speed 2.5</Text.Caption>
					</View>
				</View>
			</Section>
		</GalleryScreen>
	);
}
