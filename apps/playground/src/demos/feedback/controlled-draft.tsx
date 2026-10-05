import { Button } from "@delacour/react-native-ui/button";
import { Feedback } from "@delacour/react-native-ui/feedback";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled draft",
	caption:
		"`value` and `onValueChange` from the screen's state, and `isOpen` with `onOpenChange` too. The screen can prefill the draft, read it while the dialog is closed, and close it after a send.",
	align: "center",
	keyboardAware: true,
};

const PREFILL = "The export button is hard to find on the reports screen.";

export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [sent, setSent] = useState(0);

	return (
		<View className="items-center gap-3">
			<View className="flex-row gap-2">
				<Button onPress={() => setIsOpen(true)} testID="feedback-controlled-open" variant="secondary">
					Open
				</Button>
				<Button
					onPress={() => {
						setDraft(PREFILL);
						setIsOpen(true);
					}}
					testID="feedback-controlled-prefill"
					variant="secondary"
				>
					Open prefilled
				</Button>
			</View>
			<Text.Caption color="muted" testID="feedback-controlled-count">
				{`Draft: ${draft.length} characters · sent ${sent}`}
			</Text.Caption>
			<Feedback isOpen={isOpen} onOpenChange={setIsOpen} onValueChange={setDraft} value={draft}>
				<Feedback.Content>
					<Feedback.Panel>
						<Feedback.Title>Suggest an improvement</Feedback.Title>
						<Feedback.Close />
						<Feedback.Field placeholder="One idea per message" testID="feedback-controlled-field" />
					</Feedback.Panel>
					<Feedback.Footer>
						<Feedback.Cancel />
						<Feedback.Submit
							onSubmit={() => {
								setSent((count) => count + 1);
								setDraft("");
								setIsOpen(false);
							}}
							testID="feedback-controlled-send"
						/>
					</Feedback.Footer>
				</Feedback.Content>
			</Feedback>
		</View>
	);
}
