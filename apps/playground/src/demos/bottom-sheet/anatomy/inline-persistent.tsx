import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline and persistent",
	caption:
		"`<BottomSheet.Portal inline>` renders the sheet where it is written — an absolute fill of the nearest positioned ancestor — instead of teleporting it above the app. With `defaultOpen`, no overlay and `enablePanDownToClose={false}` it is a drawer that is always there: a map's result list, a player's queue. Drag the handle between the two detents; a drag past the first does nothing.",
	note: "With VoiceOver on, the handle is the one adjustable element: swipe up to raise the sheet a detent and down to lower it.",
	capture: { align: "stretch", flow: "bottom-sheet/anatomy/inline-persistent" },
};

const SNAP_POINTS = ["30%", "70%"] as const;
const STAGE_HEIGHT = 520;

/**
 * A stage the sheet lives inside — the drawer's host, and the only reason the
 * sheet has a bottom edge to rest on. The readout under it is `onIndexChange`,
 * which is how a flow proves which detent the drawer is on.
 */
export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);

	return (
		<View className="w-full gap-2">
			<View
				className="w-full overflow-hidden rounded-xl border border-border bg-muted"
				style={{ height: STAGE_HEIGHT }}
				testID="inline-stage"
			>
				<Text.Caption className="p-4" color="muted">
					The stage. The sheet lives inside this box and never leaves it.
				</Text.Caption>
				<BottomSheet
					defaultOpen
					dynamicSizing={false}
					enablePanDownToClose={false}
					onIndexChange={setIndex}
					snapPoints={SNAP_POINTS}
				>
					<BottomSheet.Portal inline>
						<BottomSheet.Container testID="inline-panel">
							<BottomSheet.Content>
								<BottomSheet.Title>Nearby</BottomSheet.Title>
								<BottomSheet.Description>
									Two detents, 30% and 70% of the stage. There is no closed state to fall into.
								</BottomSheet.Description>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</View>
			<Text.Caption color="muted" testID="inline-readout">
				{`Detent ${index + 1} of ${SNAP_POINTS.length}`}
			</Text.Caption>
		</View>
	);
}
