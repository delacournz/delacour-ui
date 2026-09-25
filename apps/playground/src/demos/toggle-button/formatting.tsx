import { Icon } from "@delacour/react-native-ui/icon";
import { IconBold, IconItalic, IconStrikeThrough, IconUnderline } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiple selection",
	caption:
		"A set of independent marks — bold *and* italic. The group holds one array of values and `onSelected` fires with the whole new list.",
	align: "center",
	capture: {},
};

const MARKS = [
	{ icon: IconBold, label: "Bold", value: "bold" },
	{ icon: IconItalic, label: "Italic", value: "italic" },
	{ icon: IconUnderline, label: "Underline", value: "underline" },
	{ icon: IconStrikeThrough, label: "Strikethrough", value: "strike" },
] as const;

export function Demo(): ReactElement {
	const [marks, setMarks] = useState<string[]>(["bold"]);

	return (
		<View className="w-80 items-center gap-4">
			<ToggleButton.Group
				accessibilityLabel="Text formatting"
				className="self-center"
				haptic="selection"
				onSelected={setMarks}
				selected={marks}
				size="icon-md"
				testID="formatting-group"
				variant="outline"
			>
				{MARKS.map((mark) => (
					<ToggleButton
						accessibilityLabel={mark.label}
						key={mark.value}
						testID={`formatting-${mark.value}`}
						value={mark.value}
					>
						<Icon icon={mark.icon} />
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<Text.Code>{JSON.stringify(marks)}</Text.Code>
		</View>
	);
}
