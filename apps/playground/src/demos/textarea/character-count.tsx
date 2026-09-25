import { Field } from "@delacour/react-native-ui/field";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Character count",
	caption:
		"`showCount` with `maxLength` puts a count under the trailing edge. It turns destructive the moment typing stops working, at the limit rather than past it.",
	keyboardAware: true,
	capture: { align: "stretch", hero: true },
};

const LIMIT = 80;

export function Demo(): ReactElement {
	const [status, setStatus] = useState("Heading to the Wellington waterfront for the afternoon.");

	return (
		<Field>
			<Field.Label>Status</Field.Label>
			<Textarea maxLength={LIMIT} onChangeText={setStatus} rows={3} showCount testID="status" value={status} />
		</Field>
	);
}
