import { BUTTON_ICON_SIZES, Button, type ButtonIconSize } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconHeart, IconPlusMedium, IconTrashCan } from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icon button",
	caption: "An `icon-*` size squares the footprint. The glyph needs an `accessibilityLabel`.",
	align: "center",
	capture: {},
};

const LABELS: Record<ButtonIconSize, string> = {
	"icon-sm": "Favourite, small",
	"icon-md": "Favourite, medium",
	"icon-lg": "Favourite, large",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-3">
			{BUTTON_ICON_SIZES.map((size) => (
				<Button accessibilityLabel={LABELS[size]} key={size} size={size} testID={`favourite-${size}`}>
					<Icon icon={IconHeart} />
				</Button>
			))}
			<Button accessibilityLabel="Delete" size="icon-md" testID="delete" variant="destructive-soft">
				<Icon icon={IconTrashCan} />
			</Button>
			<Button accessibilityLabel="Add" size="icon-md" testID="add" variant="outline">
				<Icon icon={IconPlusMedium} />
			</Button>
		</View>
	);
}
