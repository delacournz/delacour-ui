import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { MARKER_VARIANTS, Marker, type MarkerVariant } from "@delacour/react-native-ui/marker";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`default` is a bare row, `border` a hairline capsule that hugs its words, `separator` a label ruled to both edges.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<MarkerVariant, string> = {
	default: "Explored 4 files",
	border: "Task complete",
	separator: "Yesterday",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{MARKER_VARIANTS.map((variant) => (
				<Marker key={variant} variant={variant}>
					{variant === "separator" ? null : (
						<Marker.Icon>
							<Icon icon={IconMagnifyingGlass} />
						</Marker.Icon>
					)}
					<Marker.Content>{LABELS[variant]}</Marker.Content>
				</Marker>
			))}
		</View>
	);
}
