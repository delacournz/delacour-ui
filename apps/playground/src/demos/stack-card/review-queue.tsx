import { Avatar } from "@delacour/react-native-ui/avatar";
import {
	IconArrowRotateCounterClockwise,
	IconCheckmark2,
	IconCrossSmall,
} from "@delacour/react-native-ui/icons/central";
import { StackCard } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Review queue",
	caption:
		"Throw the top card right to keep it and left to skip it, or answer with the buttons under the pile. The stamps fade in as the card leans their way, and the card behind is already in place when the top one leaves.",
	capture: { align: "stretch", flow: "stack-card/review-queue", hero: true },
};

const PEOPLE = [
	{ id: "aria", name: "Aria Whitlock", role: "Product designer", city: "Wellington" },
	{ id: "tomasi", name: "Tomasi Fifita", role: "iOS engineer", city: "Auckland" },
	{ id: "rawiri", name: "Rawiri Kemp", role: "Data analyst", city: "Christchurch" },
	{ id: "lena", name: "Lena Varga", role: "Support lead", city: "Dunedin" },
	{ id: "isla", name: "Isla Brennan", role: "Android engineer", city: "Hamilton" },
] as const;

export function Demo(): ReactElement {
	return (
		<StackCard className="h-[460px]" directionLabels={{ left: "Skip", right: "Keep" }} testID="review-deck">
			<StackCard.Stamp color="success" direction="right">
				Keep
			</StackCard.Stamp>
			<StackCard.Stamp color="destructive" direction="left">
				Skip
			</StackCard.Stamp>
			{PEOPLE.map((person) => (
				<StackCard.Card
					className="items-center justify-center gap-3 p-6"
					key={person.id}
					testID={`review-card-${person.id}`}
				>
					<Avatar name={person.name} size="xl" />
					<Text variant="header">{person.name}</Text>
					<Text color="muted">
						{person.role} · {person.city}
					</Text>
				</StackCard.Card>
			))}
			<StackCard.Empty>All caught up</StackCard.Empty>
			<StackCard.Actions>
				<StackCard.Action action="left" icon={IconCrossSmall} testID="review-skip" />
				<StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} testID="review-undo" />
				<StackCard.Action action="right" icon={IconCheckmark2} testID="review-keep" />
			</StackCard.Actions>
		</StackCard>
	);
}
