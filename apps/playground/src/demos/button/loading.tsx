import { BUTTON_LABEL_SIZES, BUTTON_SPINNER_PLACEMENTS, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading",
	caption:
		"`isLoading` composes a spinner in and blocks the press. `spinnerPlacement` decides where it goes — `only` replaces the content and keeps the footprint.",
	capture: { align: "stretch" },
};

const PLACEMENT_LABELS: Record<(typeof BUTTON_SPINNER_PLACEMENTS)[number], string> = {
	start: "Spinner at the start",
	end: "Spinner at the end",
	only: "Spinner only",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_SPINNER_PLACEMENTS.map((placement) => (
				<Button isLoading key={placement} spinnerPlacement={placement} testID={`loading-${placement}`}>
					<Icon icon={IconPlusMedium} />
					<Button.Label>{PLACEMENT_LABELS[placement]}</Button.Label>
				</Button>
			))}
			{BUTTON_LABEL_SIZES.map((size) => (
				<Button isLoading key={size} size={size} testID={`loading-size-${size}`} variant="secondary">
					Loading
				</Button>
			))}
		</View>
	);
}
