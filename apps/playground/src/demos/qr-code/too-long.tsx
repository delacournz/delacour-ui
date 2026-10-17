import { QRCode, type QrEncodeError } from "@delacour/react-native-ui/qr-code";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Too long",
	align: "center",
	note: "Four thousand bytes is more than a version-40 code holds at level M. `onEncodeError` reports the size and the capacity, and the tile stays empty rather than drawing a code that does not scan.",
};

const VALUE = "x".repeat(4000);

function describe(error: QrEncodeError): string {
	if (error.kind === "too-long") return `${error.bytes} bytes; level ${error.errorCorrection} holds ${error.capacity}.`;
	if (error.kind === "empty") return "Nothing to encode.";
	return `Invalid ${error.option}: ${error.value}.`;
}

export function Demo(): ReactElement {
	const [error, setError] = useState<QrEncodeError | null>(null);

	return (
		<View className="items-center gap-3">
			<QRCode onEncodeError={setError} size="sm" testID="qr-code-too-long" value={VALUE} />
			<Text.Caption color="muted">{error ? describe(error) : "Encoding…"}</Text.Caption>
		</View>
	);
}
