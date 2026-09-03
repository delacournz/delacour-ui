import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Set and legend",
	caption: "A group is spacing; a set is meaning. Reach for a set when the fields share a heading.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field.Set>
			<Field.Legend>Billing address</Field.Legend>
			<Field.Description>Where the invoice is sent, if it differs from the delivery address.</Field.Description>
			<Field.Group>
				<Field>
					<Field.Label>Street</Field.Label>
					<Input placeholder="12 Cuba Street" />
				</Field>
				<Field>
					<Field.Label>City</Field.Label>
					<Input placeholder="Wellington" />
				</Field>
			</Field.Group>
		</Field.Set>
	);
}
