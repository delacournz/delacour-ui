import { SIGNATURE_SIZES, Signature, type SignatureSize } from "@delacour/react-native-ui/signature";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"`sm`, `md` and `lg` are fixed pad heights; `full` fills its parent. `secondary` is an outlined pad rather than a filled one.",
};

const LABELS: Record<Exclude<SignatureSize, "full">, string> = { sm: "Small", md: "Medium", lg: "Large" };

const FIXED = SIGNATURE_SIZES.filter((size): size is Exclude<SignatureSize, "full"> => size !== "full");

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{FIXED.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Signature size={size} variant={size === "md" ? "secondary" : "primary"} />
				</View>
			))}
		</View>
	);
}
