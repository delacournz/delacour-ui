import { ICON_SIZES, Icon } from "@delacour/native-ui/icon";
import { IconStar } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The size scale",
	align: "center",
	caption:
		"`xs`, `sm`, `md`, `lg`, `xl`, `2xl` — 14, 16, 18, 20, 24 and 32pt, held as `size-icon-*` token classes rather than as numbers. `Spinner` names the same steps off the same scale, so a named step is the same edge length in both and one can stand in for the other with nothing moving.",
	note: "With no `size`, no `className` and nothing to inherit, the fallback is `size-icon-lg` — 20pt, on the `foreground` token.",
	capture: { hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-end gap-5">
			{ICON_SIZES.map((size) => (
				<View className="items-center gap-2" key={size}>
					<Icon icon={IconStar} size={size} />
					<Text.Caption size="xs">{size}</Text.Caption>
				</View>
			))}
		</View>
	);
}
