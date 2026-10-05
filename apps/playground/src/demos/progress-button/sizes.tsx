import {
	PROGRESS_BUTTON_SIZES,
	ProgressButton,
	type ProgressButtonSize,
} from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"The button's own heights, padding and label steps — a progress button sits level with a `Button` beside it.",
	align: "center",
};

const LABELS: Record<ProgressButtonSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-3">
			{PROGRESS_BUTTON_SIZES.map((size) => (
				<ProgressButton isAutoReset key={size} size={size} testID={`size-${size}`}>
					{`Hold · ${LABELS[size]}`}
				</ProgressButton>
			))}
		</View>
	);
}
