import { Icon } from "@delacour/native-ui/icon";
import { IconArrowsRepeatCircle } from "@delacour/native-ui/icons/central";
import { SPINNER_COLORS, SPINNER_SIZES, Spinner } from "@delacour/native-ui/spinner";
import type { ReactElement } from "react";
import { Text, View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

export default function SpinnerGallery(): ReactElement {
	return (
		<GalleryScreen subtitle="Size and colour are inherited, not passed" title="Spinner">
			<Section title="Sizes">
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

			<Section title="Colours">
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

			<Section title="Custom glyph">
				<Text className="text-muted-foreground text-sm">
					A bare child is wrapped automatically so it still rotates. `speed` sets the rate.
				</Text>
				<View className="flex-row items-center gap-6">
					<View className="items-center gap-2">
						<Spinner color="danger" size="lg">
							<Icon icon={IconArrowsRepeatCircle} />
						</Spinner>
						<Text className="text-muted-foreground text-xs">bare child</Text>
					</View>
					<View className="items-center gap-2">
						<Spinner color="warning" size="lg" speed={0.4}>
							<Icon icon={IconArrowsRepeatCircle} />
						</Spinner>
						<Text className="text-muted-foreground text-xs">speed 0.4</Text>
					</View>
					<View className="items-center gap-2">
						<Spinner size="lg" speed={2.5} />
						<Text className="text-muted-foreground text-xs">speed 2.5</Text>
					</View>
				</View>
			</Section>
		</GalleryScreen>
	);
}
