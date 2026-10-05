import { QRCode } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ScopedTheme } from "uniwind";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a dark theme",
	note: "Everything around it follows the theme; the code does not. Its tile stays light, because an inverted code is one many scanners cannot read.",
};

export function Demo(): ReactElement {
	return (
		<ScopedTheme theme="dark">
			<View className="items-center gap-3 rounded-lg bg-background p-6">
				<Text.Header>Scan to check in</Text.Header>
				<QRCode accessibilityLabel="Check in at the front desk" size="sm" value="https://ui.delacour.co.nz/check-in" />
			</View>
		</ScopedTheme>
	);
}
