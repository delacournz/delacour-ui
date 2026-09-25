import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Filters",
	caption:
		'`layout="detached"` spaces the toggles apart and wraps them — a row of filters over a list. Clear every filter and the whole list comes back.',
	capture: { align: "stretch" },
};

type Status = "open" | "review" | "done" | "blocked";

/** Written out rather than mapped from the value, so no reader is shown a raw key. */
const STATUS_LABELS: Record<Status, string> = {
	open: "Open",
	review: "In review",
	done: "Done",
	blocked: "Blocked",
};

const STATUSES = Object.keys(STATUS_LABELS) as Status[];

const TASKS: readonly { id: string; title: string; status: Status }[] = [
	{ id: "1", status: "open", title: "Draft the release notes" },
	{ id: "2", status: "review", title: "Tighten the group seam" },
	{ id: "3", status: "done", title: "Capture the previews" },
	{ id: "4", status: "blocked", title: "Publish to npm" },
	{ id: "5", status: "open", title: "Write the docs page" },
];

export function Demo(): ReactElement {
	const [statuses, setStatuses] = useState<string[]>(["open", "review"]);
	const visible = statuses.length === 0 ? TASKS : TASKS.filter((task) => statuses.includes(task.status));

	return (
		<View className="gap-4">
			<ToggleButton.Group
				accessibilityLabel="Filter by status"
				haptic="selection"
				layout="detached"
				onSelected={setStatuses}
				selected={statuses}
				size="sm"
				testID="filters-group"
				variant="outline"
			>
				{STATUSES.map((status) => (
					<ToggleButton key={status} testID={`filter-${status}`} value={status}>
						{`${STATUS_LABELS[status]} ${TASKS.filter((task) => task.status === status).length}`}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<View className="min-h-96">
				<ListGroup>
					{visible.map((task) => (
						<ListGroup.Item key={task.id} testID={`task-${task.id}`}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{task.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{STATUS_LABELS[task.status]}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
					))}
				</ListGroup>
			</View>
		</View>
	);
}
