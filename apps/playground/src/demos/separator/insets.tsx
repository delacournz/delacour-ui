import { Separator } from "@delacour/native-ui/separator";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Insets",
	caption:
		"The rule stretches to its parent rather than claiming a percentage width, so a margin insets it evenly instead of pushing it off the far edge.",
};

const INSETS = ["", "mx-4", "mx-10"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4 rounded-2xl border border-border bg-card p-4">
			{INSETS.map((inset) => (
				<View className="gap-3" key={inset || "none"}>
					<Text.Caption size="xs">{inset || "no inset"}</Text.Caption>
					<Separator className={inset} />
				</View>
			))}
		</View>
	);
}
