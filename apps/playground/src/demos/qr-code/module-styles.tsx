import { QR_MODULE_STYLES, QRCode, type QrModuleStyle } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Module styles",
	align: "center",
	caption:
		"Square merges runs into rectangles; rounded softens only the corners with no neighbour, so runs fuse; dots draws each module as a dot. The three finders stay a ring and a core in every style — a finder made of dots is one a decoder cannot lock onto.",
	capture: {},
};

const LABELS: Record<QrModuleStyle, string> = {
	square: "Square",
	rounded: "Rounded",
	dots: "Dots",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap justify-center gap-4">
			{QR_MODULE_STYLES.map((style) => (
				<View className="items-center gap-2" key={style}>
					<QRCode
						accessibilityLabel={`${LABELS[style]} QR code for the Delacour docs`}
						moduleStyle={style}
						size={104}
						testID={`qr-code-${style}`}
						value="https://ui.delacour.co.nz"
					/>
					<Text.Caption color="muted">{LABELS[style]}</Text.Caption>
				</View>
			))}
		</View>
	);
}
