import { Button } from "@delacour/react-native-ui/button";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import { IconBookmark, IconHeart, IconShareOs, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icon buttons",
	caption:
		"Long-press any button to see what it does. A plain tap still presses it; the label hides itself, or on the next tap anywhere.",
	align: "center",
	capture: { flow: "tooltip/icon-buttons", frame: "device", hero: true },
};

type Action = "share" | "save" | "like" | "delete";

const ACTIONS: Record<Action, { label: string; icon: IconComponent }> = {
	share: { label: "Share", icon: IconShareOs },
	save: { label: "Save", icon: IconBookmark },
	like: { label: "Like", icon: IconHeart },
	delete: { label: "Delete", icon: IconTrashCan },
};

function ActionTooltip({ action }: { action: Action }): ReactElement {
	const { label, icon } = ACTIONS[action];
	return (
		<Tooltip label={label}>
			<Tooltip.Trigger asChild>
				<Button size="icon-md" testID={`tooltip-${action}`} variant="ghost">
					<Icon icon={icon} />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<Tooltip.Arrow />
				<Tooltip.Text>{label}</Tooltip.Text>
			</Tooltip.Content>
		</Tooltip>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<View className="flex-row gap-2 rounded-full border border-border bg-card p-1">
				{(Object.keys(ACTIONS) as Action[]).map((action) => (
					<ActionTooltip action={action} key={action} />
				))}
			</View>
		</View>
	);
}
