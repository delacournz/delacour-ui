import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled row",
};

export function Demo(): ReactElement {
	return (
		<ListGroup>
			<ListGroup.Item testID="row-available">
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Available</ListGroup.ItemTitle>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix />
			</ListGroup.Item>
			<ListGroup.Item isDisabled testID="row-unavailable">
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>Unavailable</ListGroup.ItemTitle>
					<ListGroup.ItemDescription>Blocked, dimmed and announced as disabled</ListGroup.ItemDescription>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix />
			</ListGroup.Item>
		</ListGroup>
	);
}
