import { Icon } from "@delacour/react-native-ui/icon";
import { IconBookmark, IconBookmarkCheck } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled and uncontrolled",
	caption:
		"`isSelected` with `onSelected` puts the state in your hands; `defaultSelected` lets the toggle hold its own. Children may be a function of the state, for content that changes with it.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	const [isSaved, setIsSaved] = useState(false);

	return (
		<View className="w-80 items-center gap-4">
			<ToggleButton isSelected={isSaved} onSelected={setIsSaved} testID="controlled-save" variant="outline">
				{({ isSelected }) => (
					<>
						<Icon icon={isSelected ? IconBookmarkCheck : IconBookmark} />
						<ToggleButton.Label>{isSelected ? "Saved" : "Save"}</ToggleButton.Label>
					</>
				)}
			</ToggleButton>
			<Text.Code>{`isSelected: ${isSaved}`}</Text.Code>
			<ToggleButton defaultSelected testID="uncontrolled-notify">
				Notify me
			</ToggleButton>
		</View>
	);
}
