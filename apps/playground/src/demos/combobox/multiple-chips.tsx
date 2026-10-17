import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiple with chips",
	caption:
		'`selectionMode="multiple"` keeps the sheet open and shows the selection as removable chips — on the trigger, folding into `+N` past three, and above the search field. Backspace in an empty field marks the last chip, and a second press removes it.',
	capture: { flow: "combobox/multiple-chips", frame: "device" },
};

const SKILLS = [
	{ label: "Accessibility", value: "a11y" },
	{ label: "Animation", value: "animation" },
	{ label: "Design systems", value: "design-systems" },
	{ label: "GraphQL", value: "graphql" },
	{ label: "iOS", value: "ios" },
	{ label: "Kotlin", value: "kotlin" },
	{ label: "Performance", value: "performance" },
	{ label: "React Native", value: "react-native" },
	{ label: "Swift", value: "swift" },
	{ label: "Testing", value: "testing" },
	{ label: "TypeScript", value: "typescript" },
] as const;

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * the capture stage hands a `device` demo the full window with no gutter, and
 * the sheet it opens needs the screen to rise over.
 */
export function Demo(): ReactElement {
	const [skills, setSkills] = useState<string[]>(["react-native", "typescript"]);

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Combobox
				isClearable
				maxSelected={6}
				onValueChange={setSkills}
				options={SKILLS}
				placeholder="Add skills"
				selectionMode="multiple"
				testID="combobox-multiple"
				title="Skills"
				value={skills}
			/>
		</View>
	);
}
