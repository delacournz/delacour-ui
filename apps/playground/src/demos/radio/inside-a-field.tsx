import { Field } from "@delacour/native-ui/field";
import { Radio } from "@delacour/native-ui/radio";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a Field",
	note: "The group names no state of its own — the rings turn danger from the Field's context, and go quiet the moment a plan is picked.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [fieldPlan, setFieldPlan] = useState<string>();

	return (
		<Field isInvalid={fieldPlan === undefined}>
			<Field.Label>Plan</Field.Label>
			<Radio.Group accessibilityLabel="Plan" onSelected={setFieldPlan} selected={fieldPlan ?? null}>
				<Radio testID="radio-free" value="free">
					Free
				</Radio>
				<Radio testID="radio-pro" value="pro">
					Pro
				</Radio>
			</Radio.Group>
			<Field.Error>{fieldPlan === undefined ? "Pick a plan to continue." : ""}</Field.Error>
		</Field>
	);
}
