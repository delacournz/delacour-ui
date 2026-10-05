import { Button } from "@delacour/react-native-ui/button";
import { DRAWER_SIZES, Drawer, type DrawerSize } from "@delacour/react-native-ui/drawer";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"A fraction of the window with a cap: `sm` 62% to 280pt, `md` 78% to 320pt, `lg` 88% to 400pt, `full` 94% with no cap — so a phone always keeps a strip of the app to tap away on.",
	align: "center",
	capture: { flow: "drawer/sizes", frame: "device" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<DrawerSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
	full: "Full",
};

/** One drawer per size, each with a trigger of its own. */
function SizedDrawer({ size }: { size: DrawerSize }): ReactElement {
	return (
		<Drawer>
			<Drawer.Trigger asChild>
				<Button size="sm" testID={`drawer-sizes-${size}`} variant="outline">
					{LABELS[size]}
				</Button>
			</Drawer.Trigger>
			<Drawer.Content side="start" size={size} testID={`drawer-sizes-panel-${size}`}>
				<Drawer.Header>
					<Drawer.Title>{LABELS[size]}</Drawer.Title>
					<Drawer.Description>The panel's width for size “{size}”.</Drawer.Description>
				</Drawer.Header>
				<Drawer.Body>
					<Text.Paragraph color="muted">Swipe toward the edge, or tap the strip of app beside it.</Text.Paragraph>
				</Drawer.Body>
			</Drawer.Content>
		</Drawer>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="grow flex-row flex-wrap content-center items-center justify-center gap-2">
			{DRAWER_SIZES.map((size) => (
				<SizedDrawer key={size} size={size} />
			))}
		</View>
	);
}
