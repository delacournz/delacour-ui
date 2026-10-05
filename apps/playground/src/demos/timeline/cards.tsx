import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Cards",
	caption: "`card` sets each event's content on a surface, with the marker meeting the card's title.",
	capture: { align: "stretch" },
};

const UPDATES = [
	{ title: "Ticket opened", date: "08:12", description: "Checkout fails on the last step for some cards." },
	{ title: "Reproduced", date: "09:40", description: "Only when the billing address has two lines." },
	{ title: "Fix shipped", date: "13:05", description: "Rolled out to everyone; watching the error rate." },
] as const;

export function Demo(): ReactElement {
	return (
		<Timeline value={2} variant="card">
			{UPDATES.map((update, index) => (
				<Timeline.Item
					key={update.title}
					step={index}
					testID={`timeline-card-${index}`}
					tone={index === 2 ? "success" : "default"}
				>
					<Timeline.Header>
						<Timeline.Title>{update.title}</Timeline.Title>
						<Timeline.Date>{update.date}</Timeline.Date>
					</Timeline.Header>
					<Timeline.Description>{update.description}</Timeline.Description>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
