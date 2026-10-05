import { STACK_CARD_LAYOUTS, StackCard, type StackCardLayout } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Layouts",
	caption:
		"`layout` draws the cards behind the top: `stack` steps each one down and smaller, `fan` turns them about the bottom centre, `flat` hides them. `depth` says how many are drawn.",
	capture: { align: "stretch", flow: "stack-card/layouts" },
};

const LABELS: Record<StackCardLayout, string> = {
	stack: "Stack",
	fan: "Fan",
	flat: "Flat",
};

const CARDS = ["One", "Two", "Three", "Four", "Five", "Six"] as const;

export function Demo(): ReactElement {
	const [layout, setLayout] = useState<StackCardLayout>("stack");

	return (
		<View className="gap-10">
			<ToggleButton.Group
				accessibilityLabel="Layout"
				className="self-center"
				isSelectionRequired
				onSelected={(next) => {
					const value = STACK_CARD_LAYOUTS.find((candidate) => candidate === next[0]);
					if (value) setLayout(value);
				}}
				selected={[layout]}
				selectionMode="single"
				size="sm"
				testID="layout-group"
				variant="outline"
			>
				{STACK_CARD_LAYOUTS.map((value) => (
					<ToggleButton key={value} testID={`layout-${value}`} value={value}>
						{LABELS[value]}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<StackCard className="mx-16 h-[360px]" depth={3} key={layout} layout={layout} testID="layout-deck">
				{CARDS.map((label) => (
					<StackCard.Card className="items-center justify-center" key={label}>
						<Text variant="display">{label}</Text>
					</StackCard.Card>
				))}
				<StackCard.Empty>That was all six</StackCard.Empty>
			</StackCard>
		</View>
	);
}
