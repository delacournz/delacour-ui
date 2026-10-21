import { Button } from "@delacour/react-native-ui/button";
import { Signature, type SignatureHandle, type SignatureValue } from "@delacour/react-native-ui/signature";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef, useState } from "react";
import { Image, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Export",
	caption:
		'The ref hands back the drawing as a standalone SVG or a PNG, framed alike. `viewBox: "tight"` crops it to the ink, and the colours are literal, because a file has no theme to resolve a token against.',
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
	const pad = useRef<SignatureHandle>(null);
	const [svg, setSvg] = useState<string | null>(null);
	const [png, setPng] = useState<string | null>(null);

	return (
		<View className="gap-4">
			<Signature defaultValue={SAMPLE} ref={pad} testID="signature-export" />
			<View className="flex-row gap-2">
				<Button
					className="flex-1"
					onPress={() => setSvg(pad.current?.toSVG({ background: "#ffffff", viewBox: "tight" }) ?? null)}
					testID="signature-export-button"
					variant="secondary"
				>
					<Button.Label>Export SVG</Button.Label>
				</Button>
				<Button
					className="flex-1"
					onPress={() => setPng(pad.current?.toPNG({ background: "#ffffff", viewBox: "tight" }) || null)}
					testID="signature-export-png-button"
					variant="secondary"
				>
					<Button.Label>Export PNG</Button.Label>
				</Button>
			</View>
			{svg ? (
				<Text.Code numberOfLines={6} testID="signature-export-output">
					{svg}
				</Text.Code>
			) : null}
			{png ? (
				<Image
					accessibilityLabel="Exported signature PNG"
					className="h-24 w-full rounded-md"
					resizeMode="contain"
					source={{ uri: `data:image/png;base64,${png}` }}
					testID="signature-export-png"
				/>
			) : null}
		</View>
	);
}
