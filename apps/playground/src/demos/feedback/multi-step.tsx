import { Button } from "@delacour/react-native-ui/button";
import { Feedback, useFeedback } from "@delacour/react-native-ui/feedback";
import { Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multi-step",
	caption:
		"A rating, then a message, then thanks — the caller swaps the panel's and footer's children. The well eases between heights; the shell never jumps.",
	align: "center",
	keyboardAware: true,
};

type Step = "rating" | "message" | "thanks";

/** Each step swaps what is in the well and what is in the footer; the shell stays put. */
function Steps({ step, setStep }: { step: Step; setStep: (step: Step) => void }): ReactElement {
	const { close, clear } = useFeedback();
	const [score, setScore] = useState(0);

	const finish = () => {
		close();
		clear();
		setScore(0);
	};

	if (step === "rating") {
		return (
			<Feedback.Content>
				<Feedback.Panel>
					<Feedback.Title>How was checkout?</Feedback.Title>
					<Feedback.Close />
					<Rating onChange={setScore} value={score}>
						<Rating.Stars accessibilityLabel="Checkout rating" testID="feedback-steps-rating" />
					</Rating>
				</Feedback.Panel>
				<Feedback.Footer>
					<Feedback.Cancel />
					<Feedback.Action
						isDisabled={score === 0}
						onPress={() => setStep("message")}
						testID="feedback-steps-next"
						variant="primary"
					>
						Next
					</Feedback.Action>
				</Feedback.Footer>
			</Feedback.Content>
		);
	}

	if (step === "message") {
		return (
			<Feedback.Content>
				<Feedback.Panel>
					<Feedback.Title>What could be better?</Feedback.Title>
					<Feedback.Close />
					<Feedback.Field minRows={4} placeholder="Optional" testID="feedback-steps-field" />
				</Feedback.Panel>
				<Feedback.Footer>
					<Feedback.Action onPress={() => setStep("rating")}>Back</Feedback.Action>
					<Feedback.Submit canSubmitEmpty onSubmit={() => setStep("thanks")} testID="feedback-steps-send" />
				</Feedback.Footer>
			</Feedback.Content>
		);
	}

	return (
		<Feedback.Content>
			<Feedback.Panel>
				<Feedback.Title>Thanks — that helps.</Feedback.Title>
				<Text.Paragraph color="muted">We read every one of these.</Text.Paragraph>
			</Feedback.Panel>
			<Feedback.Footer>
				<Feedback.Action onPress={finish} testID="feedback-steps-done" variant="primary">
					Done
				</Feedback.Action>
			</Feedback.Footer>
		</Feedback.Content>
	);
}

export function Demo(): ReactElement {
	const [step, setStep] = useState<Step>("rating");

	return (
		<Feedback onOpenChange={(isOpen) => isOpen && setStep("rating")}>
			<Feedback.Trigger asChild>
				<Button testID="feedback-steps-open" variant="secondary">
					Rate checkout
				</Button>
			</Feedback.Trigger>
			<Steps setStep={setStep} step={step} />
		</Feedback>
	);
}
