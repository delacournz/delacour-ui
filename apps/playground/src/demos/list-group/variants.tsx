import { LIST_GROUP_VARIANTS, ListGroup } from "delacour-react-native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof LIST_GROUP_VARIANTS)[number], string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{LIST_GROUP_VARIANTS.map((variant) => (
				<ListGroup key={variant} variant={variant}>
					<ListGroup.Item testID={`row-${variant}`}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{LABELS[variant]}</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Surface for the {variant} variant</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Second row</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			))}
		</View>
	);
}
