import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Support } from "@delacour/react-native-ui/support";
import { Text } from "@delacour/react-native-ui/text";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A thread",
	caption:
		"The furniture around a transcript: the agent, the ticket, a handoff between turns, suggested replies and a note above the composer. The turns here are stand-in markup — they are the app's, never Support's. Toggle typing to see the status line give way.",
	keyboardAware: true,
	align: "stretch",
	capture: { align: "stretch", flow: true },
};

type Side = "them" | "you";

/** Stand-in markup for a turn. A real app renders its own message component here. */
function Turn({ side, children }: { side: Side; children: string }): ReactElement {
	return (
		<View
			className={
				side === "you"
					? "max-w-[80%] self-end rounded-2xl bg-primary px-3 py-2"
					: "max-w-[80%] self-start rounded-2xl bg-muted px-3 py-2"
			}
		>
			<Text className={side === "you" ? "text-primary-foreground" : "text-foreground"}>{children}</Text>
		</View>
	);
}

export function Demo(): ReactElement {
	const [typing, setTyping] = useState(true);

	return (
		<Support availability="online" className="gap-4">
			<Support.Agent
				avatar={<Avatar name="Omar Haddad" />}
				name="Omar Haddad"
				title="Support"
				typing={typing}
				typingTestID="support-typing"
			/>
			<Support.Ticket reference="#4821" status="open" title="Refund for order #4821" />
			<View className="gap-2">
				<Turn side="you">My refund hasn't arrived.</Turn>
				<Turn side="them">I can look into that. Which card did you pay with?</Turn>
				<Support.Handoff announce={false}>
					You were passed to Omar, who can see everything you told the assistant.
				</Support.Handoff>
				<Turn side="them">Hi, I'm Omar. I've found the order — one moment.</Turn>
			</View>
			<Support.Replies>
				<Support.Reply label="Thanks" onPress={() => {}} />
				<Support.Reply label="It was a Visa" onPress={() => {}} />
				<Support.Reply label="Send me an email instead" onPress={() => {}} />
			</Support.Replies>
			<Support.Note>We'll reply by email if you leave.</Support.Note>
			<Textarea placeholder="Write a message" rows={2} />
			<Button
				onPress={() => setTyping((current) => !current)}
				size="sm"
				testID="support-typing-toggle"
				variant="secondary"
			>
				{typing ? "Stop typing" : "Start typing"}
			</Button>
		</Support>
	);
}
