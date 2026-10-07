import { Button } from "@delacour/react-native-ui/button";
import type { PopoverPlacement } from "@delacour/react-native-ui/popover";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placements",
	caption: "`placement` picks the side the label prefers — `top` by default. A side without room flips.",
	align: "center",
};

const LABELS: Record<PopoverPlacement, string> = {
	top: "Top",
	bottom: "Bottom",
	left: "Left",
	right: "Right",
};

function PlacementTooltip({ placement }: { placement: PopoverPlacement }): ReactElement {
	return (
		<Tooltip openOn="press">
			<Tooltip.Trigger asChild>
				<Button size="sm" testID={`tooltip-${placement}`} variant="outline">
					{LABELS[placement]}
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content placement={placement}>
				<Tooltip.Arrow />
				<Tooltip.Text>{`On the ${placement}`}</Tooltip.Text>
			</Tooltip.Content>
		</Tooltip>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-3">
			<PlacementTooltip placement="top" />
			<View className="flex-row gap-3">
				<PlacementTooltip placement="left" />
				<PlacementTooltip placement="right" />
			</View>
			<PlacementTooltip placement="bottom" />
		</View>
	);
}
