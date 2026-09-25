import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Text } from "@delacour/react-native-ui/text";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import { Keyboard, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Feedback form",
	caption:
		"A textarea under a single-line field reads as the same control at a different height. Send it empty and the `Field` reports the error; start typing and it clears.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const LIMIT = 500;

type Status = { kind: "editing"; attempted: boolean } | { kind: "sent"; length: number };

export function Demo(): ReactElement {
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [status, setStatus] = useState<Status>({ attempted: false, kind: "editing" });

	const isBodyInvalid = status.kind === "editing" && status.attempted && body.trim().length === 0;

	const send = () => {
		if (body.trim().length === 0) {
			setStatus({ attempted: true, kind: "editing" });
			return;
		}
		Keyboard.dismiss();
		setStatus({ kind: "sent", length: body.length });
		setSubject("");
		setBody("");
	};

	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Subject</Field.Label>
				<Input onChangeText={setSubject} placeholder="What is it about?" testID="subject" value={subject} />
			</Field>
			<Field isInvalid={isBodyInvalid}>
				<Field.Label>Feedback</Field.Label>
				<Textarea
					autoGrow
					maxLength={LIMIT}
					maxRows={8}
					onChangeText={(text) => {
						setBody(text);
						if (status.kind === "sent") setStatus({ attempted: false, kind: "editing" });
					}}
					placeholder="Tell us what worked and what did not"
					rows={3}
					showCount
					testID="feedback"
					value={body}
				/>
				<Field.Description>Read by a person, usually within a day.</Field.Description>
				<Field.Error>{isBodyInvalid ? "Write something before sending." : undefined}</Field.Error>
			</Field>
			<Button haptic="medium" onPress={send} testID="send">
				Send feedback
			</Button>
			{status.kind === "sent" ? (
				<Text.Caption color="success" testID="sent">{`Sent — ${status.length} characters. Thank you.`}</Text.Caption>
			) : null}
		</View>
	);
}
