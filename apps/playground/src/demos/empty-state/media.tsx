import {
	EMPTY_STATE_MEDIA_VARIANTS,
	EmptyState,
	type EmptyStateMediaVariant,
} from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCloudOff } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Media",
	caption:
		"`icon` tints a rounded box behind the glyph and draws it at full contrast. `default` draws nothing behind it, and a bare glyph stays muted.",
	capture: { align: "stretch" },
};

const LABELS: Record<EmptyStateMediaVariant, string> = {
	default: "Bare glyph",
	icon: "Tinted box",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row gap-3">
			{EMPTY_STATE_MEDIA_VARIANTS.map((variant) => (
				<EmptyState className="flex-1" key={variant} size="sm" testID={`media-${variant}`} variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant={variant}>
							<Icon icon={IconCloudOff} />
						</EmptyState.Media>
						<EmptyState.Title>{LABELS[variant]}</EmptyState.Title>
						<EmptyState.Description>Nothing synced.</EmptyState.Description>
					</EmptyState.Header>
				</EmptyState>
			))}
		</View>
	);
}
