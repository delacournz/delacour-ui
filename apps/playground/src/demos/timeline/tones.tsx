import { Timeline, type TimelineTone } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tones",
	caption:
		"Progress is solid, kind is tinted. A toned event keeps its soft fill whatever its progress, so a failed step stays visible once the sequence moves past it.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const EVENTS: Record<TimelineTone, { title: string; description: string }> = {
	default: { title: "Deploy queued", description: "Waiting for a runner." },
	info: { title: "Build started", description: "Commit 3f20954 on develop." },
	destructive: { title: "Tests failed", description: "Two suites, retried once." },
	warning: { title: "Retried with cache off", description: "Slower, but clean." },
	success: { title: "Deployed", description: "Live on staging." },
};

const ORDER: readonly TimelineTone[] = ["default", "info", "destructive", "warning", "success"];

export function Demo(): ReactElement {
	return (
		<Timeline value={4}>
			{ORDER.map((tone, index) => (
				<Timeline.Item key={tone} step={index} testID={`timeline-tone-${tone}`} tone={tone}>
					<Timeline.Title>{EVENTS[tone].title}</Timeline.Title>
					<Timeline.Description>{EVENTS[tone].description}</Timeline.Description>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
