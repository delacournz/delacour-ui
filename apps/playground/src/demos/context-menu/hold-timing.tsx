import { CONTEXT_MENU_HOLD, ContextMenu } from "@delacour/react-native-ui/context-menu";
import { IconPin, IconShareOs } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hold timing",
	caption:
		"`delay` is how long the hold lasts before it opens, and `slop` how far the finger may drift meanwhile — past it, a scroll takes the touch.",
	note: "The delay has a 150ms floor: anything shorter is a tap.",
	capture: { frame: "device", flow: "context-menu/hold-timing" },
};

const TIMINGS = [
	{ delay: 150, label: "Quick" },
	{ delay: CONTEXT_MENU_HOLD.delay, label: "Default" },
	{ delay: 800, label: "Deliberate" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-1 justify-center gap-3 px-screen-gutter">
			{TIMINGS.map(({ delay, label }) => (
				<ContextMenu key={label}>
					<ContextMenu.Trigger anchor="target" delay={delay} haptic="light" testID={`context-menu-hold-${delay}`}>
						<View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
							<Text className="text-card-foreground">{label}</Text>
							<Text className="text-muted-foreground text-sm">{`${delay}ms`}</Text>
						</View>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item icon={IconPin} testID={`context-menu-hold-${delay}-pin`}>
							Pin
						</ContextMenu.Item>
						<ContextMenu.Item icon={IconShareOs}>Share</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu>
			))}
		</View>
	);
}
