import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Every crumb before the last goes back to that level; the last is the current page, in plain text. The list puts a chevron between each pair.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<Breadcrumb>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link onPress={() => {}} testID="breadcrumb-basic-home">
						Home
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Item>
					<Breadcrumb.Link onPress={() => {}} testID="breadcrumb-basic-settings">
						Settings
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Item>
					<Breadcrumb.Page>Security</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb>
	);
}
