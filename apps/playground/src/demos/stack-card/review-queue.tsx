import { Avatar } from "@delacour/react-native-ui/avatar";
import {
	IconArrowRotateCounterClockwise,
	IconCheckmark2,
	IconCrossSmall,
} from "@delacour/react-native-ui/icons/central";
import { StackCard } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Review queue",
	caption:
		"Throw the top card right to keep it and left to skip it, or answer with the buttons under the pile. The stamps fade in as the card leans their way, and the card behind is already in place when the top one leaves.",
};

const PEOPLE = [
	{ id: "ana", name: "Ana Kealoha", role: "Product designer", city: "Wellington" },
	{ id: "ben", name: "Ben Okafor", role: "iOS engineer", city: "Auckland" },
	{ id: "chloe", name: "Chloé Martin", role: "Data analyst", city: "Christchurch" },
	{ id: "dev", name: "Dev Raman", role: "Support lead", city: "Dunedin" },
	{ id: "eru", name: "Eru Tane", role: "Android engineer", city: "Hamilton" },
] as const;

export function Demo(): ReactElement {
	const [kept, setKept] = useState<string[]>([]);

	return (
		<View className="gap-3">
			<StackCard
				className="h-[460px]"
				directionLabels={{ left: "Skip", right: "Keep" }}
				onSwipe={(direction, index) => {
					if (direction === "right") setKept((list) => [...list, PEOPLE[index].name]);
				}}
				testID="review-deck"
			>
				<StackCard.Stamp color="success" direction="right">
					Keep
				</StackCard.Stamp>
				<StackCard.Stamp color="destructive" direction="left">
					Skip
				</StackCard.Stamp>
				{PEOPLE.map((person) => (
					<StackCard.Card className="items-center justify-center gap-3 p-6" key={person.id}>
						<Avatar name={person.name} size="xl" />
						<Text variant="header">{person.name}</Text>
						<Text color="muted">
							{person.role} · {person.city}
						</Text>
					</StackCard.Card>
				))}
				<StackCard.Empty>All caught up</StackCard.Empty>
				<StackCard.Actions>
					<StackCard.Action action="left" icon={IconCrossSmall} />
					<StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} />
					<StackCard.Action action="right" icon={IconCheckmark2} />
				</StackCard.Actions>
			</StackCard>
			<Text align="center" variant="caption">
				Kept: {kept.length === 0 ? "nobody yet" : kept.join(", ")}
			</Text>
		</View>
	);
}
