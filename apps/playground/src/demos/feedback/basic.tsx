import { Button } from "@delacour/react-native-ui/button";
import { Feedback, useFeedback } from "@delacour/react-native-ui/feedback";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"The field sits in a recessed well; the actions sit on the band around it. Send stays disabled until there is something to send.",
	note: "Close it with text in the field and open it again: the draft is still there. Sending clears it.",
	align: "center",
	keyboardAware: true,
};

/** Send has to close and clear itself — `Feedback.Submit` never closes on its own. */
function SendButton(): ReactElement {
	const { clear, close } = useFeedback();
	return (
		<Feedback.Submit
			onSubmit={() => {
				close();
				clear();
			}}
			testID="feedback-basic-send"
		/>
	);
}

export function Demo(): ReactElement {
	return (
		<Feedback>
			<Feedback.Trigger asChild>
				<Button testID="feedback-basic-open" variant="secondary">
					Give feedback
				</Button>
			</Feedback.Trigger>
			<Feedback.Content>
				<Feedback.Panel>
					<Feedback.Title>What should we fix first?</Feedback.Title>
					<Feedback.Close testID="feedback-basic-close" />
					<Feedback.Field placeholder="Tell us what got in your way" testID="feedback-basic-field" />
				</Feedback.Panel>
				<Feedback.Footer>
					<Feedback.Cancel testID="feedback-basic-cancel" />
					<SendButton />
				</Feedback.Footer>
			</Feedback.Content>
		</Feedback>
	);
}
