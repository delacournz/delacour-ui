import { Icon } from "@delacour/native-ui/icon";
import { IconBolt } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A numeric size",
	align: "center",
	caption:
		"An edge length in points is the escape hatch, and it is the one source that never becomes a class: it goes straight to the glyph's own `size` prop, which is what makes it beat an inherited class and a `size-*` `className` alike.",
	note: "Overriding through `className` uses `size-*`, not `w-*` with `h-*`. tailwind-merge conflicts `size` into `w`/`h` but not the reverse, so a trailing `w-6` will not clear a leading `size-5`.",
};

const POINTS = [14, 22, 36, 52] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-end gap-5">
			{POINTS.map((points) => (
				<View className="items-center gap-2" key={points}>
					<Icon icon={IconBolt} size={points} />
					<Text.Caption size="xs">{points}pt</Text.Caption>
				</View>
			))}
		</View>
	);
}
