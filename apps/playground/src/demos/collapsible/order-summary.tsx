import { Button } from "@delacour/react-native-ui/button";
import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconReceiptBill } from "@delacour/react-native-ui/icons/central";
import { Separator } from "@delacour/react-native-ui/separator";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Order summary",
	caption:
		"A checkout's collapsed summary: the total rides on the row, the line items wait in the panel, and the button below follows the panel down as it opens rather than jumping.",
	capture: { align: "stretch", flow: "collapsible/order-summary" },
};

const LINES = [
	{ key: "jacket", name: "Waxed jacket", detail: "Olive · M", price: "$289.00" },
	{ key: "beanie", name: "Merino beanie", detail: "Charcoal", price: "$45.00" },
	{ key: "shipping", name: "Shipping", detail: "Tracked, 2–4 days", price: "$12.00" },
] as const;

const TOTAL = "$346.00";

function Line({ name, detail, price }: { name: string; detail: string; price: string }): ReactElement {
	return (
		<View className="flex-row items-start justify-between gap-3">
			<View className="min-w-0 flex-1">
				<Text.Label>{name}</Text.Label>
				<Text.Caption>{detail}</Text.Caption>
			</View>
			<Text.Label>{price}</Text.Label>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Collapsible>
				<Collapsible.Trigger testID="order-summary">
					<Icon icon={IconReceiptBill} />
					<Collapsible.Title>Order summary</Collapsible.Title>
					<Collapsible.Description>{`3 items · ${TOTAL}`}</Collapsible.Description>
				</Collapsible.Trigger>
				<Collapsible.Content className="gap-3">
					{LINES.map((line) => (
						<Line detail={line.detail} key={line.key} name={line.name} price={line.price} />
					))}
					<Separator />
					<View className="flex-row justify-between">
						<Text.Strong>Total</Text.Strong>
						<Text.Strong>{TOTAL}</Text.Strong>
					</View>
				</Collapsible.Content>
			</Collapsible>
			<Button testID="pay">{`Pay ${TOTAL}`}</Button>
		</View>
	);
}
