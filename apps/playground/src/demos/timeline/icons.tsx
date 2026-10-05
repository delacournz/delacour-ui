import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import { IconCreditCard1, IconHome, IconPackage, IconTruck } from "@delacour/react-native-ui/icons/central";
import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icons",
	caption:
		"`icon` holds a glyph per event. Write it into `Timeline.Indicator`; it inherits the marker's size and colour.",
};

const EVENTS: readonly { title: string; date: string; icon: IconComponent }[] = [
	{ title: "Paid", date: "Mon", icon: IconCreditCard1 },
	{ title: "Packed", date: "Tue", icon: IconPackage },
	{ title: "Out for delivery", date: "Wed", icon: IconTruck },
	{ title: "Home", date: "Thu", icon: IconHome },
];

export function Demo(): ReactElement {
	return (
		<Timeline value={2} variant="icon">
			{EVENTS.map((event, index) => (
				<Timeline.Item key={event.title} step={index} testID={`timeline-icon-${index}`}>
					<Timeline.Indicator>
						<Icon icon={event.icon} />
					</Timeline.Indicator>
					<Timeline.Header>
						<Timeline.Title>{event.title}</Timeline.Title>
						<Timeline.Date>{event.date}</Timeline.Date>
					</Timeline.Header>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
