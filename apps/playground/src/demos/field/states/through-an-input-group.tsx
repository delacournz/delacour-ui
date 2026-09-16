import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconAt } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Through an Input.Group",
	caption:
		"The group reads the field too, so a decorated field turns destructive the same way — border, prefix icon, caret and affix together.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field isInvalid>
			<Field.Label>Email</Field.Label>
			<Input.Group>
				<Input.Group.Prefix>
					<Icon icon={IconAt} />
				</Input.Group.Prefix>
				<Input defaultValue="not-an-email" />
				<Input.Group.Suffix>required</Input.Group.Suffix>
			</Input.Group>
			<Field.Error>Enter a valid email address.</Field.Error>
		</Field>
	);
}
