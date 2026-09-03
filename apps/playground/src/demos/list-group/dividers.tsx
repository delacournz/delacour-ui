import { ListGroup } from "delacour-react-native-ui/list-group";
import { Separator } from "delacour-react-native-ui/separator";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dividers",
	caption: "Off entirely with `isDivided={false}`; a hand-placed Separator suppresses the automatic one at that gap.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<ListGroup isDivided={false}>
				<ListGroup.Item>No divider</ListGroup.Item>
				<ListGroup.Item>Between these rows</ListGroup.Item>
			</ListGroup>
			<ListGroup>
				<ListGroup.Item>Automatic divider below</ListGroup.Item>
				<ListGroup.Item>Full-bleed divider below</ListGroup.Item>
				<Separator />
				<ListGroup.Item>Last row</ListGroup.Item>
			</ListGroup>
		</View>
	);
}
