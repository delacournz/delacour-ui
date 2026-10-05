import { QR_ERROR_CORRECTIONS, QRCode, type QrErrorCorrection } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Error correction",
	align: "center",
	caption:
		"The same value at all four levels. Each step up survives more damage — roughly 7, 15, 25 and 30 percent of codewords — and pays for it in density.",
	capture: {},
};

const LABELS: Record<QrErrorCorrection, string> = {
	L: "L · 7%",
	M: "M · 15%",
	Q: "Q · 25%",
	H: "H · 30%",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap justify-center gap-4">
			{QR_ERROR_CORRECTIONS.map((level) => (
				<View className="items-center gap-2" key={level}>
					<QRCode
						accessibilityLabel={`Level ${level} QR code for the Delacour docs`}
						errorCorrection={level}
						size={128}
						testID={`qr-code-${level}`}
						value="https://ui.delacour.co.nz/docs"
					/>
					<Text.Caption color="muted">{LABELS[level]}</Text.Caption>
				</View>
			))}
		</View>
	);
}
