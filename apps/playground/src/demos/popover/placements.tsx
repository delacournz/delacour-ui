import { Button } from "@delacour/react-native-ui/button";
import { Popover, type PopoverPlacement } from "@delacour/react-native-ui/popover";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placements",
	caption: "`placement` picks the side the panel prefers. It is a preference: a side without room flips.",
	align: "center",
};

const LABELS: Record<PopoverPlacement, string> = {
	top: "Top",
	bottom: "Bottom",
	left: "Left",
	right: "Right",
};

function PlacementPopover({ placement }: { placement: PopoverPlacement }): ReactElement {
	return (
		<Popover>
			<Popover.Trigger asChild>
				<Button size="sm" testID={`open-${placement}`} variant="outline">
					{LABELS[placement]}
				</Button>
			</Popover.Trigger>
			<Popover.Content placement={placement}>
				<Popover.Arrow />
				<Text.Label>{LABELS[placement]}</Text.Label>
			</Popover.Content>
		</Popover>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-3">
			<PlacementPopover placement="top" />
			<View className="flex-row gap-3">
				<PlacementPopover placement="left" />
				<PlacementPopover placement="right" />
			</View>
			<PlacementPopover placement="bottom" />
		</View>
	);
}
