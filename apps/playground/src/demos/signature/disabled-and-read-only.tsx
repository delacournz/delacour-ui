import { Signature, type SignatureValue } from "@delacour/react-native-ui/signature";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and read-only",
	caption:
		"Disabled fades the pad and its toolbar and takes no touch. Read-only shows the drawing at full strength with no toolbar at all — a signature on a receipt is content, not a control.",
};

/** A pad-sized drawing to start from: a looped name, its underline and a full stop. */
function sampleSignature(): SignatureValue {
	const name = Array.from({ length: 90 }, (_, index) => {
		const t = index / 89;
		const angle = t * Math.PI * 9;
		return { x: 36 + t * 220 + 14 * Math.cos(angle), y: 82 - 22 * Math.sin(angle) - 10 * Math.sin(t * Math.PI) };
	});
	const underline = Array.from({ length: 24 }, (_, index) => {
		const t = index / 23;
		return { x: 30 + t * 250, y: 124 - 6 * Math.sin(t * Math.PI) };
	});
	return { width: 320, height: 180, strokes: [name, underline, [{ x: 292, y: 118 }]] };
}

const SAMPLE = sampleSignature();

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-2">
				<Text.Caption color="muted">isDisabled</Text.Caption>
				<Signature defaultValue={SAMPLE} isDisabled size="sm" />
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">isReadOnly</Text.Caption>
				<Signature defaultValue={SAMPLE} hasGuideline={false} isReadOnly size="sm" />
			</View>
		</View>
	);
}
