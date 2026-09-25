import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A review",
	caption:
		"Three scores and a comment on a card. The overall score is their average, drawn read-only to the tenth, and Submit waits until every score is set.",
	keyboardAware: true,
	capture: { align: "stretch", flow: "rating/a-review" },
};

const ASPECTS = ["Food", "Service", "Value"] as const;

type Aspect = (typeof ASPECTS)[number];

export function Demo(): ReactElement {
	const [scores, setScores] = useState<Record<Aspect, number>>({ Food: 5, Service: 4, Value: 0 });
	const [submitted, setSubmitted] = useState(false);

	const rated = ASPECTS.filter((aspect) => scores[aspect] > 0);
	const average = rated.length === 0 ? 0 : rated.reduce((sum, aspect) => sum + scores[aspect], 0) / rated.length;
	const isComplete = rated.length === ASPECTS.length;

	return (
		<View className="gap-4 rounded-lg border border-border bg-card p-4">
			<View className="flex-row items-center justify-between">
				<Text.Header>Harbourside Kitchen</Text.Header>
				<Rating className="flex-row items-center gap-1" isReadOnly size="sm" value={average}>
					<Rating.Stars accessibilityLabel="Overall" testID="rating-overall" />
					<Rating.Output>{({ value }) => value.toFixed(1)}</Rating.Output>
				</Rating>
			</View>
			{ASPECTS.map((aspect) => (
				<View className="flex-row items-center justify-between" key={aspect}>
					<Text.Label>{aspect}</Text.Label>
					<Rating
						allowClear
						onChange={(value) => {
							setSubmitted(false);
							setScores((current) => ({ ...current, [aspect]: value }));
						}}
						step={0.5}
						value={scores[aspect]}
					>
						<Rating.Stars accessibilityLabel={aspect} testID={`rating-${aspect.toLowerCase()}`} />
					</Rating>
				</View>
			))}
			<Field>
				<Field.Label>Comment</Field.Label>
				<Input placeholder="What stood out?" testID="rating-comment" />
			</Field>
			<Button isDisabled={!isComplete} onPress={() => setSubmitted(true)} testID="rating-submit">
				<Button.Label>{submitted ? "Thanks!" : "Submit review"}</Button.Label>
			</Button>
		</View>
	);
}
