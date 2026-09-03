import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placeholder",
	caption:
		"`placeholderColorClassName` replaces the default. It is the only name for this colour — uniwind's `placeholderTextColorClassName` is removed from the prop surface so the two cannot disagree.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>accent-foreground</Field.Label>
				<Input placeholderColorClassName="accent-foreground" placeholder="Full contrast" />
			</Field>
			<Field>
				<Field.Label>accent-info</Field.Label>
				<Input placeholderColorClassName="accent-info" placeholder="Informational" />
			</Field>
		</View>
	);
}
