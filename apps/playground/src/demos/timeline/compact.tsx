import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Compact",
	align: "stretch",
	caption: "`compact` halves the gaps, for a dense log at `sm`.",
};

const LOG = ["Signed in", "Changed password", "Added a passkey", "Signed out of other devices", "Signed out"] as const;

export function Demo(): ReactElement {
	return (
		<Timeline size="sm" value={LOG.length} variant="compact">
			{LOG.map((entry, index) => (
				<Timeline.Item key={entry} step={index} testID={`timeline-compact-${index}`}>
					<Timeline.Title>{entry}</Timeline.Title>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
