import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Masthead and stats",
	caption: "`Timeline.Masthead` heads the sequence; `Timeline.Stats` sums an event up in a row of figures.",
};

export function Demo(): ReactElement {
	return (
		<Timeline value={2}>
			<Timeline.Masthead label="Final" title="Harbour 2 – 1 Northside" />
			<Timeline.Item step={0} testID="timeline-match-0">
				<Timeline.Header>
					<Timeline.Title>Kick-off</Timeline.Title>
					<Timeline.Date>0′</Timeline.Date>
				</Timeline.Header>
			</Timeline.Item>
			<Timeline.Item step={1} testID="timeline-match-1" tone="warning">
				<Timeline.Header>
					<Timeline.Title>Half time</Timeline.Title>
					<Timeline.Date>45′</Timeline.Date>
				</Timeline.Header>
				<Timeline.Stats>
					<Timeline.Stat label="Shots" value="7 – 4" />
					<Timeline.Stat label="Possession" value="58%" />
				</Timeline.Stats>
			</Timeline.Item>
			<Timeline.Item step={2} testID="timeline-match-2" tone="success">
				<Timeline.Header>
					<Timeline.Title>Full time</Timeline.Title>
					<Timeline.Date>90′</Timeline.Date>
				</Timeline.Header>
				<Timeline.Description>A late header settles it.</Timeline.Description>
			</Timeline.Item>
		</Timeline>
	);
}
