import { Button, type ButtonLabelSize } from "@delacour/react-native-ui/button";
import { EMPTY_STATE_SIZES, EmptyState, type EmptyStateSize } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPeopleAdd } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "One axis drives the padding, both gaps, the media box, the glyph and both type scales.",
	capture: { align: "stretch" },
};

const LABELS: Record<EmptyStateSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

/** The button step that sits with each empty-state step. */
const BUTTON_SIZE: Record<EmptyStateSize, ButtonLabelSize> = {
	sm: "sm",
	md: "md",
	lg: "lg",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{EMPTY_STATE_SIZES.map((size) => (
				<EmptyState key={size} size={size} testID={`size-${size}`} variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconPeopleAdd} />
						</EmptyState.Media>
						<EmptyState.Title>{LABELS[size]}</EmptyState.Title>
						<EmptyState.Description>Invite someone to start collaborating.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button size={BUTTON_SIZE[size]}>Invite</Button>
					</EmptyState.Content>
				</EmptyState>
			))}
		</View>
	);
}
