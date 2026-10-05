import { Field } from "@delacour/react-native-ui/field";
import { ThemeSelector } from "@delacour/react-native-ui/theme-selector";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption: "Inside a `Field` the label names the group for a screen reader, and `isDisabled` cascades.",
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Appearance</Field.Label>
			<ThemeSelector variant="cards" />
			<Field.Description>System follows your device's light and dark setting.</Field.Description>
		</Field>
	);
}
