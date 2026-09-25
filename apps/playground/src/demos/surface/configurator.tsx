import { Radio } from "@delacour/react-native-ui/radio";
import {
	SURFACE_PADDINGS,
	SURFACE_VARIANTS,
	Surface,
	type SurfacePadding,
	type SurfaceVariant,
} from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Configurator",
	caption: "Every variant against every padding, one pick at a time.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const VARIANT_LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

const PADDING_LABELS: Record<SurfacePadding, string> = {
	none: "None",
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

function isVariant(value: string): value is SurfaceVariant {
	return (SURFACE_VARIANTS as readonly string[]).includes(value);
}

function isPadding(value: string): value is SurfacePadding {
	return (SURFACE_PADDINGS as readonly string[]).includes(value);
}

export function Demo(): ReactElement {
	const [variant, setVariant] = useState<SurfaceVariant>("default");
	const [padding, setPadding] = useState<SurfacePadding>("md");

	return (
		<View className="gap-6">
			<Surface padding={padding} testID="configurator-surface" variant={variant}>
				<View className="rounded-md border border-border border-dashed px-3 py-2">
					<Text.Label testID="configurator-summary">
						{VARIANT_LABELS[variant]} · {PADDING_LABELS[padding]}
					</Text.Label>
				</View>
			</Surface>
			<View className="gap-2">
				<Text.Overline>Variant</Text.Overline>
				<Radio.Group
					accessibilityLabel="Variant"
					onSelected={(value) => isVariant(value) && setVariant(value)}
					orientation="horizontal"
					selected={variant}
				>
					{SURFACE_VARIANTS.map((name) => (
						<Radio key={name} testID={`configurator-variant-${name}`} value={name}>
							{VARIANT_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Overline>Padding</Text.Overline>
				<Radio.Group
					accessibilityLabel="Padding"
					onSelected={(value) => isPadding(value) && setPadding(value)}
					orientation="horizontal"
					selected={padding}
				>
					{SURFACE_PADDINGS.map((name) => (
						<Radio key={name} testID={`configurator-padding-${name}`} value={name}>
							{PADDING_LABELS[name]}
						</Radio>
					))}
				</Radio.Group>
			</View>
		</View>
	);
}
