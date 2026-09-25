import { Steps } from "@delacour/react-native-ui/steps";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical, with descriptions",
	caption: "Titles sit beside their indicators and the line runs down between them. Uncontrolled — tap any step.",
	capture: { align: "stretch", flow: "steps/vertical" },
};

const STEPS = [
	{ title: "Order placed", description: "We have your order and your payment." },
	{ title: "Packed", description: "Your items are boxed and labelled." },
	{ title: "On its way", description: "With the courier, arriving Thursday." },
	{ title: "Delivered", description: "Left at the front door." },
] as const;

export function Demo(): ReactElement {
	return (
		<Steps defaultValue={2} orientation="vertical">
			{STEPS.map((item, index) => (
				<Steps.Item key={item.title} step={index} testID={`steps-vertical-${index}`}>
					<Steps.Title>{item.title}</Steps.Title>
					<Steps.Description>{item.description}</Steps.Description>
				</Steps.Item>
			))}
		</Steps>
	);
}
