import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A nested set",
	caption:
		'`variant="label"` drops the legend to the treatment the fields already use, so an inner heading does not compete with the outer one.',
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field.Set>
			<Field.Legend>Notifications</Field.Legend>
			<Field.Group>
				<Field.Set>
					<Field.Legend variant="label">Email</Field.Legend>
					<Field>
						<Field.Label>Address</Field.Label>
						<Input inputMode="email" placeholder="ada@example.com" />
					</Field>
				</Field.Set>
				<Field.Set>
					<Field.Legend variant="label">Mobile</Field.Legend>
					<Field>
						<Field.Label>Number</Field.Label>
						<Input inputMode="tel" placeholder="021 555 0100" />
					</Field>
				</Field.Set>
			</Field.Group>
		</Field.Set>
	);
}
