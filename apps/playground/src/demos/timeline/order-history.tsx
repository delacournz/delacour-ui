import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Order history",
	caption:
		"One `value` says how far along the order is: events before it are completed, the one at it is current, and the rail fills up to it.",
	capture: { align: "stretch", hero: true },
};

const EVENTS = [
	{ title: "Order placed", date: "9:41", description: "Paid by card ending 4242." },
	{ title: "Packed", date: "11:02", description: "Two items, one box." },
	{ title: "With the courier", date: "14:30", description: "Arriving Thursday before noon." },
	{ title: "Delivered", date: "Thu", description: "Left at the front door." },
] as const;

export function Demo(): ReactElement {
	return (
		<Timeline value={2}>
			{EVENTS.map((event, index) => (
				<Timeline.Item key={event.title} step={index} testID={`timeline-order-${index}`}>
					<Timeline.Header>
						<Timeline.Title>{event.title}</Timeline.Title>
						<Timeline.Date>{event.date}</Timeline.Date>
					</Timeline.Header>
					<Timeline.Description>{event.description}</Timeline.Description>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
