import { INPUT_SIZES, INPUT_VARIANTS, type InputVariant } from "@delacour/react-native-ui/input";
import { TagInput } from "@delacour/react-native-ui/tag-input";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"The box is `Input`'s, so a tag input sits level with a field beside it at every size. Chips step down a size so the first one never makes the box taller.",
	keyboardAware: true,
};

const VARIANT_LABELS: Record<InputVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
};

const TAGS = ["alpha", "beta"];

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{INPUT_VARIANTS.map((variant) => (
				<View className="gap-2" key={variant}>
					<Text.Caption color="muted">{VARIANT_LABELS[variant]}</Text.Caption>
					{INPUT_SIZES.map((size) => (
						<TagInput defaultValue={TAGS} key={size} placeholder="Add a tag" size={size} variant={variant} />
					))}
				</View>
			))}
		</View>
	);
}
