import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Collapsed",
	caption:
		"Past `maxItems` the middle of the trail folds into an ellipsis. `itemsBeforeCollapse` and `itemsAfterCollapse` choose how much of each end stays.",
};

const TRAIL = ["Home", "Documents", "Work", "Clients", "Northwind", "Invoices", "2026"] as const;

function Trail({ before, after }: { before?: number; after?: number }): ReactElement {
	return (
		<Breadcrumb>
			<Breadcrumb.List itemsAfterCollapse={after} itemsBeforeCollapse={before} maxItems={4}>
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

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<Trail />
			<Trail after={2} />
			<Trail after={1} before={0} />
		</View>
	);
}
