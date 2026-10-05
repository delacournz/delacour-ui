import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import { Spinner } from "@delacour/react-native-ui/spinner";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`isCompleted` hands the state to you. Accept the hold in `onComplete`, run the request inside a custom `Done`, and set `isCompleted` back to `false` to rewind — here the request fails every other time.",
	align: "center",
};

type Phase = "idle" | "sending" | "sent";

const LABELS: Record<Phase, string> = {
	idle: "Hold to submit",
	sending: "Sending",
	sent: "Sent",
};

export function Demo(): ReactElement {
	const [phase, setPhase] = useState<Phase>("idle");
	const [attempt, setAttempt] = useState(0);

	const submit = () => {
		setPhase("sending");
		const next = attempt + 1;
		setAttempt(next);
		setTimeout(() => {
			if (next % 2 === 1) {
				setPhase("idle");
				return;
			}
			setPhase("sent");
			setTimeout(() => setPhase("idle"), 1500);
		}, 1200);
	};

	return (
		<View className="w-64 items-center gap-4">
			<ProgressButton
				className="self-stretch"
				isCompleted={phase !== "idle"}
				onComplete={submit}
				testID="controlled-submit"
			>
				<ProgressButton.Label>{LABELS.idle}</ProgressButton.Label>
				<ProgressButton.Done>
					{phase === "sending" ? <Spinner /> : null}
					<ProgressButton.Label>{LABELS[phase]}</ProgressButton.Label>
				</ProgressButton.Done>
			</ProgressButton>
			<Text.Code>{`phase: ${phase}`}</Text.Code>
		</View>
	);
}
