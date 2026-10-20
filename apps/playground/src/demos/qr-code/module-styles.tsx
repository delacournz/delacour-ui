import { QR_MODULE_STYLES, QRCode, type QrModuleStyle } from "@delacour/react-native-ui/qr-code";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Module styles",
	align: "center",
	caption:
		"Square merges runs into rectangles; rounded softens only the corners with no neighbour, so runs fuse; dots draws each module as a dot. The three finders stay a ring and a core in every style — a finder made of dots is one a decoder cannot lock onto.",
	capture: { flow: true, hero: true },
};

const LABELS: Record<QrModuleStyle, string> = {
	square: "Square",
	rounded: "Rounded",
	dots: "Dots",
};

function isModuleStyle(value: string | undefined): value is QrModuleStyle {
	return QR_MODULE_STYLES.some((style) => style === value);
}

/** One code and a picker, so a style change redraws the same modules in place. Tapping the selected style keeps it. */
export function Demo(): ReactElement {
	const [style, setStyle] = useState<QrModuleStyle>("square");

	return (
		<View className="items-center gap-4">
			<QRCode
				accessibilityLabel={`${LABELS[style]} QR code for the Delacour docs`}
				moduleStyle={style}
				size="md"
				testID="qr-code"
				value="https://ui.delacour.co.nz"
			/>
			<ToggleButton.Group
				onSelected={(selected) => {
					const next = selected[0];
					if (isModuleStyle(next)) setStyle(next);
				}}
				selected={[style]}
				selectionMode="single"
				size="sm"
				testID="qr-code-style"
				variant="outline"
			>
				{QR_MODULE_STYLES.map((option) => (
					<ToggleButton key={option} testID={`qr-code-style-${option}`} value={option}>
						{LABELS[option]}
					</ToggleButton>
				))}
			</ToggleButton.Group>
		</View>
	);
}
