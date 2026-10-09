import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A cap of three",
	caption:
		"`max={3}` caps both a tap and select-all. At the cap the rest stop going on, but a pick still comes off, and select-all reads Deselect all because there is nothing left for it to add.",
	capture: { align: "stretch", flow: "selection-mode/max-limit" },
};

const TOPPINGS = [
	{ id: "mushroom", title: "Mushroom" },
	{ id: "olive", title: "Olive" },
	{ id: "pepper", title: "Roast pepper" },
	{ id: "onion", title: "Red onion" },
	{ id: "basil", title: "Basil" },
	{ id: "chilli", title: "Chilli" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="h-[480px]">
			<SelectionMode
				defaultActive
				defaultSelected={["olive", "basil"]}
				max={3}
				values={TOPPINGS.map((topping) => topping.id)}
			>
				<SelectionMode.Header selectAllTestID="toppings-select-all" title="Toppings" />
				<ScrollView contentContainerClassName="pt-3">
					<SelectionMode.Group>
						{TOPPINGS.map((topping) => (
							<SelectionMode.Item key={topping.id} testID={`topping-${topping.id}`} value={topping.id}>
								<Item>
									<Item.Content>
										<Item.Title>{topping.title}</Item.Title>
									</Item.Content>
								</Item>
							</SelectionMode.Item>
						))}
					</SelectionMode.Group>
				</ScrollView>
			</SelectionMode>
		</View>
	);
}
