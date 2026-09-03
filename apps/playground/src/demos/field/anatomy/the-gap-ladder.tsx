import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The gap ladder",
	caption:
		"A field's own parts sit closer together than two fields do. Cover the labels and the two fields still read as two — that is the only thing keeping them apart.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field.Group>
			<Field>
				<Field.Label>City</Field.Label>
				<Input placeholder="Wellington" />
				<Field.Description>Where the invoice is sent.</Field.Description>
			</Field>
			<Field>
				<Field.Label>Postcode</Field.Label>
				<Input inputMode="numeric" placeholder="6011" />
				<Field.Description>Four digits.</Field.Description>
			</Field>
		</Field.Group>
	);
}
