import { Badge } from "@delacour/react-native-ui/badge";
import { Card } from "@delacour/react-native-ui/card";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckCircle2 } from "@delacour/react-native-ui/icons/central";
import { Pressable } from "@delacour/react-native-ui/pressable";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Plan picker",
	caption:
		"A card is layout, so a card that selects is a `Pressable` around it. The selection is controlled, the chosen card is outlined in the primary colour, and the retired plan is disabled.",
	capture: { align: "stretch" },
};

type Plan = {
	id: string;
	name: string;
	price: string;
	description: string;
	isDisabled?: boolean;
};

const PLANS: readonly Plan[] = [
	{ id: "hobby", name: "Hobby", price: "Free", description: "One project, community support." },
	{ id: "pro", name: "Pro", price: "$20/mo", description: "Unlimited projects, email support." },
	{ id: "legacy", name: "Legacy", price: "$12/mo", description: "No longer offered.", isDisabled: true },
];

/** One selectable plan — the press, the role and the checked state live here, not on the card. */
function PlanCard({
	plan,
	isSelected,
	onSelect,
}: {
	plan: Plan;
	isSelected: boolean;
	onSelect: (id: string) => void;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={`${plan.name}, ${plan.price}`}
			accessibilityRole="radio"
			accessibilityState={{ checked: isSelected, disabled: plan.isDisabled }}
			disabled={plan.isDisabled}
			feedback="scale"
			haptic="selection"
			onPress={() => onSelect(plan.id)}
			testID={`card-plan-${plan.id}`}
		>
			<Card className={isSelected ? "border-primary" : plan.isDisabled ? "opacity-50" : undefined} size="sm">
				<Card.Header>
					<Card.Title>{plan.name}</Card.Title>
					<Card.Description>{plan.description}</Card.Description>
					<Card.Action className="gap-2">
						{plan.isDisabled ? (
							<Badge size="sm" variant="outline">
								Retired
							</Badge>
						) : (
							<Text.Label>{plan.price}</Text.Label>
						)}
						{isSelected ? <Icon color="primary" icon={IconCheckCircle2} size="md" /> : null}
					</Card.Action>
				</Card.Header>
			</Card>
		</Pressable>
	);
}

export function Demo(): ReactElement {
	const [selected, setSelected] = useState("pro");

	return (
		<View accessibilityLabel="Plan" accessibilityRole="radiogroup" className="gap-3">
			{PLANS.map((plan) => (
				<PlanCard isSelected={selected === plan.id} key={plan.id} onSelect={setSelected} plan={plan} />
			))}
			<Text.Caption className="text-center" testID="card-plan-summary">
				{PLANS.find((plan) => plan.id === selected)?.name} selected
			</Text.Caption>
		</View>
	);
}
