import { SEARCH_BAR_CANCEL_MODES, SearchBar, type SearchBarCancelMode } from "@delacour/react-native-ui/search-bar";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Cancel modes",
	caption:
		"`cancel` decides when the Cancel action shows: `focus` (the default) slides it in while the field has focus, `always` keeps it, `never` leaves the field the full width.",
	capture: { align: "stretch", flow: true },
};

const LABELS: Record<SearchBarCancelMode, string> = {
	never: "Cancel never",
	focus: "Cancel on focus",
	always: "Cancel always",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SEARCH_BAR_CANCEL_MODES.map((mode) => (
				<SearchBar cancel={mode} key={mode} placeholder={LABELS[mode]} testID={`cancel-${mode}`} />
			))}
		</View>
	);
}
