import { EmptyState } from "@delacour/react-native-ui/empty-state";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Text only",
	caption: "Every part is optional. A title and a line is enough for a section that is simply empty.",
};

export function Demo(): ReactElement {
	return (
		<EmptyState size="sm" testID="text-only" variant="card">
			<EmptyState.Header>
				<EmptyState.Title>No upcoming events</EmptyState.Title>
				<EmptyState.Description>Events you're invited to will appear here.</EmptyState.Description>
			</EmptyState.Header>
		</EmptyState>
	);
}
