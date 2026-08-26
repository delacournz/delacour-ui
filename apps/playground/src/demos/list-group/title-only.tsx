import { ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Title only",
	note: "A bare string child is wrapped in a title inside a content column — React Native would crash on it otherwise.",
};

export function Demo(): ReactElement {
	return (
		<ListGroup>
			<ListGroup.Item testID="row-wifi">Wi-Fi</ListGroup.Item>
			<ListGroup.Item testID="row-bluetooth">Bluetooth</ListGroup.Item>
			<ListGroup.Item testID="row-airplane">Airplane mode</ListGroup.Item>
		</ListGroup>
	);
}
