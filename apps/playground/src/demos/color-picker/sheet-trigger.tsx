import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Field } from "@delacour/react-native-ui/field";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a sheet",
	caption:
		'`presentation="sheet"` puts the surface in a `BottomSheet` behind a trigger row drawn on Input\'s box. Tapping the label opens it too. Mount `BottomSheetProvider` once in the app.',
	keyboardAware: true,
};

const PRESETS = ["#f59e0b", "#ef4444", "#3b82f6", "#22c55e", "#a855f7"] as const;

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Accent</Field.Label>
			<ColorPicker defaultValue="#f59e0b" hasAlpha presentation="sheet">
				<ColorPicker.Trigger testID="color-picker-trigger" />
				<ColorPicker.Content>
					<ColorPicker.Area />
					<ColorPicker.Hue />
					<ColorPicker.Alpha />
					<ColorPicker.Input />
					<ColorPicker.Swatches colors={PRESETS} />
				</ColorPicker.Content>
			</ColorPicker>
			<Field.Description>Used for highlights and the active tab.</Field.Description>
		</Field>
	);
}
