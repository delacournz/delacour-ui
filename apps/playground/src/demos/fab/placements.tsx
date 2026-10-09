import { FAB_PLACEMENTS, Fab, type FabPlacement } from "@delacour/react-native-ui/fab";
import type { IconComponent } from "@delacour/react-native-ui/icon";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconArrowUp, IconMicrophone, IconPlusLarge } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placements",
	caption:
		"`placement` pins the fab to the bottom of its nearest positioned ancestor, `offset` points in from the edges. Start and end are logical, so a right-to-left layout mirrors them. On a screen, `isSafeAreaAware` adds the bottom inset; this box has none, so it is off.",
};

const LABELS: Record<FabPlacement, string> = {
	"bottom-start": "Record",
	"bottom-center": "Add",
	"bottom-end": "Send",
};

const ICONS: Record<FabPlacement, IconComponent> = {
	"bottom-start": IconMicrophone,
	"bottom-center": IconPlusLarge,
	"bottom-end": IconArrowUp,
};

export function Demo(): ReactElement {
	return (
		<View className="h-64 overflow-hidden rounded-xl border border-border bg-background">
			{FAB_PLACEMENTS.map((placement) => (
				<Fab
					accessibilityLabel={LABELS[placement]}
					isSafeAreaAware={false}
					key={placement}
					placement={placement}
					size="sm"
					testID={`fab-${placement}`}
					variant={placement === "bottom-center" ? "primary" : "secondary"}
				>
					<Icon icon={ICONS[placement]} />
				</Fab>
			))}
		</View>
	);
}
