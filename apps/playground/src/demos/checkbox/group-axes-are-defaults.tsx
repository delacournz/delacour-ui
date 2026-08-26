import { Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group axes are defaults",
	caption:
		"The group sets `lg` and `info`; the middle box overrides the colour and keeps the size. That is the opposite of `Input.Group`, which owns the one box its field draws into.",
};

export function Demo(): ReactElement {
	return (
		<Checkbox.Group color="info" defaultChecked={["a", "b", "c"]} size="lg">
			<Checkbox testID="checkbox-a" value="a">
				<Checkbox.Label>Inherits info</Checkbox.Label>
			</Checkbox>
			<Checkbox color="danger" testID="checkbox-b" value="b">
				<Checkbox.Label>Overrides to danger</Checkbox.Label>
			</Checkbox>
			<Checkbox testID="checkbox-c" value="c">
				<Checkbox.Label>Inherits info</Checkbox.Label>
			</Checkbox>
		</Checkbox.Group>
	);
}
