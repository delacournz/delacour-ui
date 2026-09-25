import { Button } from "@delacour/react-native-ui/button";
import { EMPTY_STATE_VARIANTS, EmptyState, type EmptyStateVariant } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconFolder1 } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`default` grows into its parent and paints nothing. `card` is a dashed block for an empty section beside populated ones.",
	capture: { align: "stretch" },
};

const LABELS: Record<EmptyStateVariant, string> = {
	default: "Default",
	card: "Card",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{EMPTY_STATE_VARIANTS.map((variant) => (
				<EmptyState key={variant} size="sm" testID={`variant-${variant}`} variant={variant}>
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconFolder1} />
						</EmptyState.Media>
						<EmptyState.Title>{LABELS[variant]}</EmptyState.Title>
						<EmptyState.Description>This folder is empty.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button size="sm" variant="secondary">
							Upload a file
						</Button>
					</EmptyState.Content>
				</EmptyState>
			))}
		</View>
	);
}
