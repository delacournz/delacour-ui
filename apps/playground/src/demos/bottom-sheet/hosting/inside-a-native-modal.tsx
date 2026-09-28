import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { Modal, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a native modal",
	caption:
		"A native `Modal` is its own window, so a sheet teleported to the app's root host would draw behind it. The fix is one wrapper: `<BottomSheet.Host name=\"modal\">` as the modal's outermost view, and every sheet written inside it teleports there without naming a `hostName`.",
	capture: { flow: "bottom-sheet/hosting/inside-a-native-modal", frame: "device" },
};

const SNAP_POINTS = ["50%"] as const;

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * a trigger left at the top would sit under the Dynamic Island.
 */
export function Demo(): ReactElement {
	const [visible, setVisible] = useState(false);

	return (
		<View className="flex-1 items-center justify-center">
			<Button onPress={() => setVisible(true)} testID="modal-open" variant="secondary">
				Present a native modal
			</Button>
			<Modal animationType="slide" onRequestClose={() => setVisible(false)} visible={visible}>
				<BottomSheet.Host name="modal" style={{ flex: 1 }}>
					<View className="flex-1 gap-4 bg-background px-5 pt-20">
						<Text.Title>A native modal</Text.Title>
						<Text.Paragraph color="muted">
							Its own window. The sheet below is written inside the modal's own host, so it opens over this screen
							rather than behind it.
						</Text.Paragraph>
						<BottomSheet dynamicSizing={false} snapPoints={SNAP_POINTS}>
							<BottomSheet.Trigger asChild>
								<Button testID="modal-open-sheet">Open a sheet in the modal</Button>
							</BottomSheet.Trigger>
							<BottomSheet.Portal>
								<BottomSheet.Overlay />
								<BottomSheet.Container testID="modal-panel">
									<BottomSheet.Content>
										<BottomSheet.Close testID="modal-close-sheet" />
										<BottomSheet.Title>Above the modal</BottomSheet.Title>
										<BottomSheet.Description>
											Teleported to the modal's host. Without one, this would be drawing behind this screen.
										</BottomSheet.Description>
									</BottomSheet.Content>
								</BottomSheet.Container>
							</BottomSheet.Portal>
						</BottomSheet>
						<Button onPress={() => setVisible(false)} testID="modal-dismiss" variant="ghost">
							Dismiss the modal
						</Button>
					</View>
				</BottomSheet.Host>
			</Modal>
		</View>
	);
}
