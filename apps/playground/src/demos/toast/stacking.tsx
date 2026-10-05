import { Button } from "@delacour/react-native-ui/button";
import { toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacking",
	caption:
		"Five at once: they enter 220 ms apart, three are drawn with the newest in front, and the other two wait their turn.",
	align: "center",
	capture: { flow: "toast/stacking", frame: "device" },
};

const FILES = ["brief.pdf", "budget.xlsx", "logo.svg", "notes.md", "photo.jpg"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<Button
				onPress={() => {
					for (const file of FILES) toast.success(`${file} downloaded`);
				}}
				testID="toast-stacking"
				variant="secondary"
			>
				Download five files
			</Button>
		</View>
	);
}
