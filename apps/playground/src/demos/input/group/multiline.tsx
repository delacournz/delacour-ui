import { Icon } from "delacour-react-native-ui/icon";
import { IconAt } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiline",
	caption: "The box grows with the text and the decorators stay on its first line.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconAt} />
			</Input.Group.Prefix>
			<Input multiline placeholder="Mention someone, at length" />
		</Input.Group>
	);
}
