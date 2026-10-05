import { Button } from "@delacour/react-native-ui/button";
import { DRAWER_SIDES, Drawer, resolveDrawerEdge, useDrawer } from "@delacour/react-native-ui/drawer";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { I18nManager, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Start and end under RTL",
	caption:
		"`start` and `end` resolve against `I18nManager.isRTL`, not a `direction` style, so a wrapper cannot flip them — the table shows the edge each side takes in both directions, and the drawer opens on the end edge for this app's direction.",
	align: "center",
	capture: {},
};

/** Reads the side and edge the open panel resolved, from inside it. */
function ResolvedEdge(): ReactElement {
	const { side, edge } = useDrawer();
	return (
		<Text.Paragraph testID="drawer-rtl-resolved">
			side “{side}” → {edge} edge
		</Text.Paragraph>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<View className="gap-1">
				{DRAWER_SIDES.map((side) => (
					<Text.Caption color="muted" key={side}>
						{side}: {resolveDrawerEdge(side, false)} in LTR · {resolveDrawerEdge(side, true)} in RTL
					</Text.Caption>
				))}
			</View>
			<Drawer>
				<Drawer.Trigger asChild>
					<Button testID="drawer-rtl-open" variant="outline">
						Open from the end
					</Button>
				</Drawer.Trigger>
				<Drawer.Content side="end" size="sm">
					<Drawer.Header>
						<Drawer.Title>{I18nManager.isRTL ? "Right to left" : "Left to right"}</Drawer.Title>
					</Drawer.Header>
					<Drawer.Body>
						<ResolvedEdge />
					</Drawer.Body>
				</Drawer.Content>
			</Drawer>
		</View>
	);
}
