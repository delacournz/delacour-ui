import { SEARCH_BAR_CANCEL_MODES, SearchBar, type SearchBarCancelMode } from "@delacour/react-native-ui/search-bar";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Cancel modes",
	caption:
		"`cancel` decides when the Cancel action shows: `focus` (the default) slides it in while the field has focus, `always` keeps it, `never` leaves the field the full width.",
	capture: { align: "stretch" },
};

const LABELS: Record<SearchBarCancelMode, string> = {
	never: "Never",
	focus: "On focus",
	always: "Always",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{SEARCH_BAR_CANCEL_MODES.map((mode) => (
				<View className="gap-1.5" key={mode}>
					<Text.Caption color="muted">{LABELS[mode]}</Text.Caption>
					<SearchBar cancel={mode} testID={`cancel-${mode}`} />
				</View>
			))}
		</View>
	);
}
