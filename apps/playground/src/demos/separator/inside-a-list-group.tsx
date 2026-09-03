import { ListGroup } from "delacour-react-native-ui/list-group";
import { Separator } from "delacour-react-native-ui/separator";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a ListGroup",
	caption:
		"ListGroup inserts these itself. A hand-placed one suppresses the automatic divider at that gap, which is how a full-bleed rule gets in among inset ones.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<ListGroup>
			<ListGroup.Item>Automatic inset divider below</ListGroup.Item>
			<ListGroup.Item>Hand-placed full-bleed rule below</ListGroup.Item>
			<Separator />
			<ListGroup.Item>Last row</ListGroup.Item>
		</ListGroup>
	);
}
