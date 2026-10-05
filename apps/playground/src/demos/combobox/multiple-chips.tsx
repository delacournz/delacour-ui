import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiple with chips",
	caption:
		'`selectionMode="multiple"` keeps the sheet open and shows the selection as removable chips — on the trigger, folding into `+N` past three, and above the search field. Backspace in an empty field marks the last chip, and a second press removes it.',
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

export function Demo(): ReactElement {
	const [skills, setSkills] = useState<string[]>(["react-native", "typescript"]);

	return (
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
	);
}
