import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconAlignmentCenter,
	IconAlignmentJustify,
	IconAlignmentLeft,
	IconAlignmentRight,
} from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single selection",
	caption:
		'`selectionMode="single"` is an either-or choice: picking one clears the last. `isSelectionRequired` keeps an answer on the board, so a re-press of the current one does nothing. Each option is announced as a radio.',
	align: "center",
	capture: {},
};

const ALIGNMENTS = [
	{ icon: IconAlignmentLeft, label: "Align left", value: "left" },
	{ icon: IconAlignmentCenter, label: "Align centre", value: "center" },
	{ icon: IconAlignmentRight, label: "Align right", value: "right" },
	{ icon: IconAlignmentJustify, label: "Justify", value: "justify" },
] as const;

export function Demo(): ReactElement {
	const [alignment, setAlignment] = useState<string[]>(["left"]);

	return (
		<View className="w-80 items-center gap-4">
			<ToggleButton.Group
				accessibilityLabel="Text alignment"
				className="self-center"
				isSelectionRequired
				onSelected={setAlignment}
				selected={alignment}
				selectionMode="single"
				size="icon-md"
				testID="alignment-group"
			>
				{ALIGNMENTS.map((option) => (
					<ToggleButton
						accessibilityLabel={option.label}
						key={option.value}
						testID={`alignment-${option.value}`}
						value={option.value}
					>
						<Icon icon={option.icon} />
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<Text.Code>{JSON.stringify(alignment)}</Text.Code>
			<ToggleButton.Group
				accessibilityLabel="Range"
				className="w-full"
				defaultSelected={["week"]}
				selectionMode="single"
				size="sm"
				testID="range-group"
				variant="outline"
			>
				<ToggleButton className="flex-1" testID="range-day" value="day">
					Day
				</ToggleButton>
				<ToggleButton className="flex-1" testID="range-week" value="week">
					Week
				</ToggleButton>
				<ToggleButton className="flex-1" testID="range-month" value="month">
					Month
				</ToggleButton>
			</ToggleButton.Group>
		</View>
	);
}
