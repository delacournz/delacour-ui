import { Avatar } from "@delacour/react-native-ui/avatar";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBubbleText, IconEmail1, IconPhone } from "@delacour/react-native-ui/icons/central";
import { Support } from "@delacour/react-native-ui/support";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A help screen",
	caption:
		"The landing route: who answers, whether anyone is there, three ways in, and two past requests — one with a reply nobody has read, one that only moved.",
	align: "stretch",
	capture: { align: "stretch" },
};

const TEAM = ["Khalid Abdi", "Mere Tane", "Sofia Rossi"] as const;

export function Demo(): ReactElement {
	return (
		<Support availability="online">
			<Support.Header
				description="Questions about an order or your account."
				title="Help"
				trailing={
					<Avatar.Group size="sm">
						{TEAM.map((name) => (
							<Avatar key={name} name={name} />
						))}
					</Avatar.Group>
				}
			/>
			<Support.Status replyTime="Typically replies in under an hour" />
			<Support.Channels title="Get in touch">
				<Support.Channel
					description="Talk to the team now"
					detail="~5m"
					icon={<Icon icon={IconBubbleText} />}
					label="Chat"
					onPress={() => {}}
					testID="support-channel-message"
				/>
				<Support.Channel detail="~1d" icon={<Icon icon={IconEmail1} />} label="Email" onPress={() => {}} />
				<Support.Channel detail="9–5" icon={<Icon icon={IconPhone} />} label="Call us" onPress={() => {}} />
			</Support.Channels>
			<Support.Conversations title="Your requests">
				<Support.Conversation
					onPress={() => {}}
					preview="We've issued the refund. It should reach your card in three to five days."
					reference="#4821"
					status="solved"
					timestamp="2h"
					title="Refund for order #4821"
					unread
				/>
				<Support.Conversation
					onPress={() => {}}
					preview="Your case was passed to the delivery team."
					reference="#4790"
					status="open"
					timestamp="Yesterday"
					title="Parcel marked delivered"
					updated
				/>
			</Support.Conversations>
		</Support>
	);
}
