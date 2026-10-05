import { Support, type SupportTicketStatus } from "@delacour/react-native-ui/support";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Past requests",
	caption:
		"Every ticket status as a soft badge. The accent dot is a reply nobody has read; the grey one, a thread that moved with nothing new to read. Both are spoken in the row's label.",
	align: "stretch",
};

type Request = {
	title: string;
	preview: string;
	status: SupportTicketStatus;
	reference: string;
	timestamp: string;
	unread?: boolean;
	updated?: boolean;
};

const REQUESTS: readonly Request[] = [
	{
		title: "Charged twice for one order",
		preview: "Could you send a screenshot of both charges?",
		status: "pending",
		reference: "#4855",
		timestamp: "10m",
		unread: true,
	},
	{
		title: "Parcel marked delivered",
		preview: "Your case was passed to the delivery team.",
		status: "open",
		reference: "#4790",
		timestamp: "Yesterday",
		updated: true,
	},
	{
		title: "Refund for order #4821",
		preview: "We've issued the refund. It should reach your card in three to five days.",
		status: "solved",
		reference: "#4821",
		timestamp: "Mon",
	},
	{
		title: "Change of address",
		preview: "Done — your next order ships to the new address.",
		status: "closed",
		reference: "#4602",
		timestamp: "12 Sep",
	},
];

export function Demo(): ReactElement {
	return (
		<Support.Conversations title="Your requests">
			{REQUESTS.map((request) => (
				<Support.Conversation key={request.reference} onPress={() => {}} {...request} />
			))}
		</Support.Conversations>
	);
}
