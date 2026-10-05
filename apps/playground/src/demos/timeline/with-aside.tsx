import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Times beside the rail",
	align: "stretch",
	caption:
		"`Timeline.Aside` holds a left column — here the time of day — and `Timeline.Trailing` a right one. Vertical only.",
};

const DAY = [
	{ time: "08:00", title: "Doors open", place: "Foyer" },
	{ time: "09:30", title: "Keynote", place: "Main hall" },
	{ time: "12:00", title: "Lunch", place: "Courtyard" },
	{ time: "13:30", title: "Workshops", place: "Rooms 2–5" },
] as const;

export function Demo(): ReactElement {
	return (
		<Timeline value={1}>
			{DAY.map((slot, index) => (
				<Timeline.Item key={slot.title} step={index} testID={`timeline-aside-${index}`}>
					<Timeline.Aside>
						<Timeline.Date>{slot.time}</Timeline.Date>
					</Timeline.Aside>
					<Timeline.Title>{slot.title}</Timeline.Title>
					<Timeline.Meta>{slot.place}</Timeline.Meta>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
