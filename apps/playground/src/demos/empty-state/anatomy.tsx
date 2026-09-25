import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconInboxEmpty, IconPlusMedium } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	caption:
		"`Header` stacks the media, title and description; `Content` holds the actions. A bare `Icon` in `Media` inherits its size and colour.",
	capture: { hero: true, align: "stretch" },
};

export function Demo(): ReactElement {
	const [drafts, setDrafts] = useState(0);

	return (
		<EmptyState testID="empty-state">
			<EmptyState.Header>
				<EmptyState.Media variant="icon">
					<Icon icon={IconInboxEmpty} />
				</EmptyState.Media>
				<EmptyState.Title>No messages yet</EmptyState.Title>
				<EmptyState.Description>
					{drafts === 0
						? "When someone writes to you, the conversation will show up here."
						: `${drafts} ${drafts === 1 ? "draft" : "drafts"} started.`}
				</EmptyState.Description>
			</EmptyState.Header>
			<EmptyState.Content>
				<Button onPress={() => setDrafts((count) => count + 1)} testID="compose">
					<Icon icon={IconPlusMedium} />
					<Button.Label>New message</Button.Label>
				</Button>
				<Button onPress={() => setDrafts(0)} testID="reset" variant="secondary">
					Clear drafts
				</Button>
			</EmptyState.Content>
		</EmptyState>
	);
}
