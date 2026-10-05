import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Typing",
	caption:
		"Two phrases typed at 22 characters a second, held, then erased at 40, with a bar caret that blinks only while it waits. Speeds, not durations: a phrase twice as long takes twice as long.",
	align: "stretch",
	capture: { align: "stretch", flow: "text-animation/typing", leadMs: 0, tailMs: 0 },
};

const PHRASES = ["Design systems that ship.", "Native apps that feel native."] as const;

export function Demo(): ReactElement {
	return (
		<TextAnimation.Typing size="2xl" testID="text-animation-typing" weight="semibold">
			{PHRASES}
		</TextAnimation.Typing>
	);
}
