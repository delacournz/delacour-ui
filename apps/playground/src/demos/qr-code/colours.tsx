import { QRCode } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "center",
	caption:
		"The default pair is pinned black on white. A brand pair works as long as it stays dark on light and above 3:1. Light modules on a dark tile — an inverted code — warn in development, because many scanners cannot read one.",
	capture: {},
};

const PAIRS = [
	{ key: "default", label: "Default", color: undefined, backgroundColor: undefined },
	{ key: "brand", label: "Brand", color: "#1e3a8a", backgroundColor: "#fef3c7" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row justify-center gap-4">
			{PAIRS.map((pair) => (
				<View className="items-center gap-2" key={pair.key}>
					<QRCode
						accessibilityLabel={`${pair.label} colours QR code`}
						backgroundColor={pair.backgroundColor}
						color={pair.color}
						moduleStyle="rounded"
						size={136}
						testID={`qr-code-${pair.key}`}
						value="https://ui.delacour.co.nz"
					/>
					<Text.Caption color="muted">{pair.label}</Text.Caption>
				</View>
			))}
		</View>
	);
}
