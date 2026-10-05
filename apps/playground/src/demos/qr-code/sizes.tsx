import { QR_SIZES, QRCode, type QrSize } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "128, 192 and 256 points, or any number. Each module is snapped to a whole number of device pixels, so abutting runs never show a hairline seam; the code centres in whatever margin that leaves.",
};

const LABELS: Record<QrSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			{QR_SIZES.map((size) => (
				<View className="items-center gap-2" key={size}>
					<QRCode accessibilityLabel={`${LABELS[size]} QR code`} size={size} value="https://ui.delacour.co.nz" />
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
				</View>
			))}
			<View className="items-center gap-2">
				<QRCode accessibilityLabel="A 96-point QR code" size={96} value="https://ui.delacour.co.nz" />
				<Text.Caption color="muted">96 points</Text.Caption>
			</View>
		</View>
	);
}
