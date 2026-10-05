import { QRCode } from "@delacour/react-native-ui/qr-code";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	align: "center",
	caption:
		"A URL encoded at level M and drawn as one vector path. The four-module quiet zone sits inside the tile, and the tile stays white in both themes — the code is for someone else's camera.",
	capture: { hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="rounded-xl border border-border p-1">
			<QRCode accessibilityLabel="Open the Delacour docs" testID="qr-code" value="https://ui.delacour.co.nz" />
		</View>
	);
}
