import { type ColorFormat, ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Formats",
	caption:
		"`format` picks the notation reported to `onValueChange` and `onValueCommit` — hex, `rgb()` or `hsl()`. The field always shows hex, and accepts any of the three.",
	keyboardAware: true,
};

const FORMATS: readonly ColorFormat[] = ["hex", "rgb", "hsl"];

const LABELS: Record<ColorFormat, string> = { hex: "Hex", rgb: "RGB", hsl: "HSL" };

export function Demo(): ReactElement {
	const [values, setValues] = useState<Record<ColorFormat, string>>({ hex: "", rgb: "", hsl: "" });

	return (
		<View className="gap-6">
			{FORMATS.map((format) => (
				<View className="gap-2" key={format}>
					<ColorPicker
						defaultValue="#0ea5e9"
						format={format}
						hasAlpha
						onValueChange={(value) => setValues((current) => ({ ...current, [format]: value }))}
						size="sm"
					/>
					<Text.Caption color="muted" testID={`color-picker-format-${format}`}>
						{`${LABELS[format]}: ${values[format] || "drag to report"}`}
					</Text.Caption>
				</View>
			))}
		</View>
	);
}
