import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scroll overflow",
	caption:
		'`overflow="scroll"` keeps the whole trail on one line in a horizontal scroller, opened at its end so the current page is in view.',
	capture: { align: "stretch" },
};

const TRAIL = ["Workspace", "Engineering", "Platform", "Services", "Payments", "Webhooks", "Retries"] as const;

export function Demo(): ReactElement {
	return (
		<Breadcrumb>
			<Breadcrumb.List overflow="scroll" testID="breadcrumb-scroll-list">
				{TRAIL.map((crumb, index) => (
					<Breadcrumb.Item key={crumb}>
						{index === TRAIL.length - 1 ? (
							<Breadcrumb.Page>{crumb}</Breadcrumb.Page>
						) : (
							<Breadcrumb.Link onPress={() => {}}>{crumb}</Breadcrumb.Link>
						)}
					</Breadcrumb.Item>
				))}
			</Breadcrumb.List>
		</Breadcrumb>
	);
}
