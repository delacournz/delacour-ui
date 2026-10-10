import {
	PROGRESS_BUTTON_VARIANTS,
	ProgressButton,
	type ProgressButtonVariant,
} from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"Every variant rests on the same surface and carries its colour in the label and the fill. The label is drawn twice, so it stays readable across the wipe.",
	align: "center",
	capture: { flow: "progress-button/variants" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<ProgressButtonVariant, string> = {
	primary: "Hold to confirm",
	secondary: "Hold to archive",
	destructive: "Hold to delete",
	success: "Hold to approve",
};

export function Demo(): ReactElement {
	return (
		<View className="w-64 gap-3">
			{PROGRESS_BUTTON_VARIANTS.map((variant) => (
				<ProgressButton isAutoReset key={variant} testID={`variant-${variant}`} variant={variant}>
					{LABELS[variant]}
				</ProgressButton>
			))}
		</View>
	);
}
