import { Fab } from "@delacour/react-native-ui/fab";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPencil } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Extended",
	caption:
		"`isExtended` turns the circle into a stadium the height of its size, with a `Fab.Label` beside the icon. The label is what a screen reader announces, so no `accessibilityLabel` is needed.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<Fab isExtended testID="fab-extended">
				<Icon icon={IconPencil} />
				<Fab.Label>Write</Fab.Label>
			</Fab>
			<Fab isExtended size="lg" testID="fab-extended-lg" variant="surface">
				<Icon icon={IconPencil} />
				<Fab.Label>Write</Fab.Label>
			</Fab>
		</View>
	);
}
