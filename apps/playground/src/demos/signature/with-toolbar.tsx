import { Signature } from "@delacour/react-native-ui/signature";
import type { ReactElement } from "react";
import { Alert } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With the toolbar written out",
	caption:
		"Write the anatomy out to choose the actions. Redo joins undo and clear; each one is disabled while it would do nothing, and a new stroke drops whatever was undone.",
	capture: { align: "stretch", flow: true, hero: true },
};

/** Stands in for the typed-name flow `alternative` shows in full. */
function typeName(): void {
	Alert.alert("Type your name", "A typed-name flow opens here.");
}

export function Demo(): ReactElement {
	return (
		<Signature onRequestAlternative={typeName}>
			<Signature.Pad testID="signature-pad" />
			<Signature.Toolbar>
				<Signature.Undo testID="signature-undo" />
				<Signature.Redo testID="signature-redo" />
				<Signature.Clear testID="signature-clear" />
			</Signature.Toolbar>
		</Signature>
	);
}
