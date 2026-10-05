import { Select } from "@delacour/react-native-ui/select";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled, read-only and loading",
	caption:
		"Disabled fades and never opens. Read-only looks normal, shows its value and never opens either. Loading swaps the chevron for a spinner, and an empty sheet shows one too.",
};

const PLANS = [
	{ label: "Free", value: "free" },
	{ label: "Team", value: "team" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Select defaultValue="team" isDisabled options={PLANS} testID="select-disabled" />
			<Select defaultValue="free" isReadOnly options={PLANS} testID="select-read-only" />
			<Select isLoading options={[]} placeholder="Loading plans" testID="select-loading" />
		</View>
	);
}
