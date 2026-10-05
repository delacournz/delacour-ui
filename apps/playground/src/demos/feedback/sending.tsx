import { Button } from "@delacour/react-native-ui/button";
import { Feedback, useFeedback } from "@delacour/react-native-ui/feedback";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sending",
	caption:
		"`onSubmit` returns a promise: Send shows its spinner and the field is read-only until it settles. The dialog stays open throughout.",
	note: "Turn on the failure switch and send: the error shows in the well and the draft is still there to retry.",
	align: "center",
	keyboardAware: true,
	capture: { flow: "feedback/sending", frame: "device" },
};

const SEND_MS = 1500;

/** A stand-in for a network call that takes a moment and can fail. */
function fakeSend(shouldFail: boolean): Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(() => (shouldFail ? reject(new Error("offline")) : resolve()), SEND_MS);
	});
}

/** The well's error line and the send action share one piece of state, so both sit under the root. */
function Body({ shouldFail }: { shouldFail: boolean }): ReactElement {
	const { clear, close } = useFeedback();
	const [error, setError] = useState<string | null>(null);

	const send = async () => {
		setError(null);
		try {
			await fakeSend(shouldFail);
			close();
			clear();
		} catch {
			setError("That didn't send. Your message is still here — try again.");
		}
	};

	return (
		<Feedback.Content>
			<Feedback.Panel>
				<Feedback.Title>Report a problem</Feedback.Title>
				<Feedback.Close />
				<Feedback.Field placeholder="What happened?" testID="feedback-sending-field" />
				{error ? (
					<Text.Caption color="destructive" testID="feedback-sending-error">
						{error}
					</Text.Caption>
				) : null}
			</Feedback.Panel>
			<Feedback.Footer>
				<Feedback.Cancel />
				<Feedback.Submit onSubmit={send} testID="feedback-sending-send" />
			</Feedback.Footer>
		</Feedback.Content>
	);
}

export function Demo(): ReactElement {
	const [shouldFail, setShouldFail] = useState(false);

	return (
		<View className="flex-1 items-center justify-center gap-4">
			<Feedback>
				<Feedback.Trigger asChild>
					<Button testID="feedback-sending-open" variant="secondary">
						Report a problem
					</Button>
				</Feedback.Trigger>
				<Body shouldFail={shouldFail} />
			</Feedback>
			<View className="flex-row items-center gap-3">
				<Switch
					accessibilityLabel="Fail the next send"
					isSelected={shouldFail}
					onSelectedChange={setShouldFail}
					testID="feedback-sending-fail"
				/>
				<Text.Caption color="muted">Fail the next send</Text.Caption>
			</View>
		</View>
	);
}
