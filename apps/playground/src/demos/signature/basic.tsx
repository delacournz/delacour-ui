import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Signature, type SignatureValue } from "@delacour/react-native-ui/signature";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"A bare `<Signature />` is a pad, a line to sign on and a toolbar holding undo, redo and clear, with a link for anyone who would rather type their name. Draw with a finger — the stroke is smoothed into ink as it goes, and a tap leaves a dot.",
	capture: { align: "stretch" },
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
	const [isTyping, setIsTyping] = useState(false);

	if (isTyping) {
		return (
			<Field>
				<Field.Label>Type your full name</Field.Label>
				<Input autoCapitalize="words" autoComplete="name" placeholder="Full name" />
			</Field>
		);
	}

	return (
		<Signature
			defaultValue={SAMPLE}
			guidelineLabel="Sign above the line"
			onRequestAlternative={() => setIsTyping(true)}
			testID="signature-basic"
		/>
	);
}
