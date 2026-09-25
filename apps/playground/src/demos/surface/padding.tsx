import { SURFACE_PADDINGS, Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Padding",
	caption: "Four steps of inner spacing. `none` also clips, for content bled to the corners.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof SURFACE_PADDINGS)[number], string> = {
	none: "None",
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

/** A tinted block, so the padding around it reads as a measurable gap. */
function Content({ label }: { label: string }): ReactElement {
	return (
		<View className="rounded-md bg-secondary px-3 py-2">
			<Text.Label>{label}</Text.Label>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SURFACE_PADDINGS.map((padding) => (
				<Surface key={padding} padding={padding} testID={`surface-padding-${padding}`}>
					<Content label={LABELS[padding]} />
				</Surface>
			))}
		</View>
	);
}
