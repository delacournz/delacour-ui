import { LIST_GROUP_VARIANTS, ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{LIST_GROUP_VARIANTS.map((variant) => (
				<ListGroup key={variant} variant={variant}>
					<ListGroup.Item testID={`row-${variant}`}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{variant}</ListGroup.ItemTitle>
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
