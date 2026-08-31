import { BUTTON_SIZES, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconHeart, IconPlusMedium, IconTrashCan } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icon only",
	caption: "`isIconOnly` squares the footprint at every size. The glyph needs an `accessibilityLabel`.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-3">
			{BUTTON_SIZES.map((size) => (
				<Button accessibilityLabel={`Favourite ${size}`} isIconOnly key={size} size={size} testID={`favourite-${size}`}>
					<Icon icon={IconHeart} />
				</Button>
			))}
			<Button accessibilityLabel="Delete" isIconOnly testID="delete" variant="destructive-soft">
				<Icon icon={IconTrashCan} />
			</Button>
			<Button accessibilityLabel="Add" isIconOnly testID="add" variant="outline">
				<Icon icon={IconPlusMedium} />
			</Button>
		</View>
	);
}
