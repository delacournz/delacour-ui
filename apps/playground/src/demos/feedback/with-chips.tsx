import { Button } from "@delacour/react-native-ui/button";
import { Chip } from "@delacour/react-native-ui/chip";
import { Feedback, useFeedback } from "@delacour/react-native-ui/feedback";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With chips",
	caption:
		"Chips above the field answer the common cases in a tap. `canSubmitEmpty` follows them, so Send opens for a chip or for text.",
	align: "center",
	keyboardAware: true,
	capture: { flow: "feedback/with-chips", frame: "device" },
};

type Topic = "slow" | "confusing" | "missing" | "broken";

const TOPICS: readonly { id: Topic; label: string }[] = [
	{ id: "slow", label: "Too slow" },
	{ id: "confusing", label: "Confusing" },
	{ id: "missing", label: "Missing a feature" },
	{ id: "broken", label: "Something broke" },
];

/** The chips live under the root so Send can read them and clear them with the draft. */
function Body(): ReactElement {
	const { clear, close } = useFeedback();
	const [picked, setPicked] = useState<ReadonlySet<Topic>>(new Set());

	const toggle = (id: Topic, isSelected: boolean) =>
		setPicked((current) => {
			const next = new Set(current);
			if (isSelected) next.add(id);
			else next.delete(id);
			return next;
		});

	return (
		<Feedback.Content>
			<Feedback.Panel>
				<Feedback.Title>What got in your way?</Feedback.Title>
				<Feedback.Close />
				<View className="flex-row flex-wrap gap-2">
					{TOPICS.map((topic) => (
						<Chip
							isSelected={picked.has(topic.id)}
							key={topic.id}
							onSelectedChange={(isSelected) => toggle(topic.id, isSelected)}
							size="sm"
							testID={`feedback-chips-${topic.id}`}
						>
							<Chip.Label>{topic.label}</Chip.Label>
						</Chip>
					))}
				</View>
				<Feedback.Field minRows={3} placeholder="Anything else?" />
			</Feedback.Panel>
			<Feedback.Footer>
				<Feedback.Cancel />
				<Feedback.Submit
					canSubmitEmpty={picked.size > 0}
					onSubmit={() => {
						close();
						clear();
						setPicked(new Set());
					}}
					testID="feedback-chips-send"
				/>
			</Feedback.Footer>
		</Feedback.Content>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<Feedback>
				<Feedback.Trigger asChild>
					<Button testID="feedback-chips-open" variant="secondary">
						Tell us more
					</Button>
				</Feedback.Trigger>
				<Body />
			</Feedback>
		</View>
	);
}
