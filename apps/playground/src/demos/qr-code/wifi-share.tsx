import { QRCode } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Share a Wi-Fi network",
	note: "The network's name and password are printed beside the code, so the code is `isDecorative` — a screen reader reads the text once rather than twice.",
};

const NETWORK = "Delacour Guest";
const PASSWORD = "harbour-light-42";

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-4 rounded-lg border border-border bg-card p-4">
			<QRCode
				isDecorative
				moduleStyle="rounded"
				size={112}
				testID="qr-code-wifi"
				value={`WIFI:T:WPA;S:${NETWORK};P:${PASSWORD};;`}
			/>
			<View className="flex-1 gap-1">
				<Text.Header>{NETWORK}</Text.Header>
				<Text.Caption color="muted">Password</Text.Caption>
				<Text.Code>{PASSWORD}</Text.Code>
			</View>
		</View>
	);
}
