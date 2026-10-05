import { Direction } from "@delacour/react-native-ui/direction";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "rtl: and ltr: classes",
	caption:
		"Uniwind's `rtl:` and `ltr:` variants resolve against the nearest `Direction`, not the app. The same classes paint the accent bar on the start edge of each card and pick its colour per subtree.",
};

function Sample({ label }: { label: string }): ReactElement {
	return (
		<View className="flex-row overflow-hidden rounded-lg border border-border bg-card">
			<View className="w-1.5 ltr:bg-primary rtl:bg-destructive" />
			<View className="flex-1 p-4">
				<Text.Label>{label}</Text.Label>
				<Text.Caption className="ltr:text-left rtl:text-right">ltr:bg-primary rtl:bg-destructive</Text.Caption>
			</View>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Direction dir="ltr">
				<Sample label="Left to right" />
			</Direction>
			<Direction dir="rtl">
				<Sample label="Right to left" />
			</Direction>
		</View>
	);
}
