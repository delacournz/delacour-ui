import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Numbered",
	caption: "`numbered` puts each event's position in its marker. Two sizes, `sm` and `md`.",
	capture: { align: "stretch" },
};

const MILESTONES = [
	{ title: "Brief signed off", date: "3 Mar" },
	{ title: "First prototype", date: "21 Mar" },
	{ title: "Field testing", date: "14 Apr" },
	{ title: "Launch", date: "2 Jun" },
] as const;

export function Demo(): ReactElement {
	return (
		<Timeline value={2} variant="numbered">
			{MILESTONES.map((milestone, index) => (
				<Timeline.Item key={milestone.title} step={index} testID={`timeline-numbered-${index}`}>
					<Timeline.Header>
						<Timeline.Title>{milestone.title}</Timeline.Title>
						<Timeline.Date>{milestone.date}</Timeline.Date>
					</Timeline.Header>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
