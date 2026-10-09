import { STACK_CARD_DIRECTIONS, StackCard, type StackCardDirection } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Four directions",
	caption:
		"`directions` lets a drag throw up and down as well. A deck that throws all four ways claims both axes, so it must not sit inside a scroller.",
};

const LABELS: Record<StackCardDirection, string> = {
	left: "Later",
	right: "Now",
	up: "Delegate",
	down: "Drop",
};

const TASKS = ["Reply to the landlord", "Book the dentist", "Renew the registration", "File the receipts"] as const;

export function Demo(): ReactElement {
	const [last, setLast] = useState<string>("Throw a card any way");

	return (
		<View className="gap-3">
			<StackCard
				className="h-[400px]"
				directionLabels={LABELS}
				directions={STACK_CARD_DIRECTIONS}
				onSwipe={(direction, index) => setLast(`${TASKS[index]}: ${LABELS[direction]}`)}
				testID="four-way-deck"
			>
				<StackCard.Stamp color="success" direction="right">
					{LABELS.right}
				</StackCard.Stamp>
				<StackCard.Stamp color="warning" direction="left">
					{LABELS.left}
				</StackCard.Stamp>
				<StackCard.Stamp color="info" direction="up">
					{LABELS.up}
				</StackCard.Stamp>
				<StackCard.Stamp color="destructive" direction="down">
					{LABELS.down}
				</StackCard.Stamp>
				{TASKS.map((task) => (
					<StackCard.Card className="items-center justify-center p-6" key={task}>
						<Text align="center" variant="title">
							{task}
						</Text>
					</StackCard.Card>
				))}
				<StackCard.Empty>Inbox zero</StackCard.Empty>
			</StackCard>
			<Text align="center" variant="caption">
				{last}
			</Text>
		</View>
	);
}
