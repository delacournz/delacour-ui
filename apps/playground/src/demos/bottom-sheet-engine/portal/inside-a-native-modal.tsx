import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a native modal",
	caption:
		'A native `Modal` is its own window, and a sheet teleported to the root host would draw behind it. The fix is one wrapper: `<BottomSheet.Host name="modal">` around the content of the modal, and every sheet written inside targets it without a `hostName`.',
};

const SNAP_POINTS = ["50%"] as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	button: {
		alignSelf: "flex-start",
		backgroundColor: "#8E8E9326",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	modal: { backgroundColor: "#0A84FF", flex: 1, gap: 12, padding: 24, paddingTop: 72 },
	modalTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
	modalCopy: { color: "#FFFFFFCC", fontSize: 15 },
	modalButton: {
		alignSelf: "flex-start",
		backgroundColor: "#FFFFFF33",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	modalButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	close: {
		alignSelf: "flex-start",
		backgroundColor: "#30D158",
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	closeLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});

export function Demo(): ReactElement {
	const [visible, setVisible] = useState(false);

	return (
		<View style={styles.root}>
			<Pressable accessibilityRole="button" onPress={() => setVisible(true)} style={styles.button} testID="modal-open">
				<Text style={styles.buttonLabel}>Present a native modal</Text>
			</Pressable>
			<Modal animationType="slide" onRequestClose={() => setVisible(false)} visible={visible}>
				<BottomSheet.Host name="modal" style={styles.modal}>
					<Text style={styles.modalTitle}>A native modal</Text>
					<Text style={styles.modalCopy}>Its own window. The sheet below is written inside the modal's own host.</Text>
					<BottomSheet dynamicSizing={false} snapPoints={SNAP_POINTS}>
						<BottomSheet.Trigger style={styles.modalButton} testID="modal-open-sheet">
							<Text style={styles.modalButtonLabel}>Open a sheet in the modal</Text>
						</BottomSheet.Trigger>
						<BottomSheet.Portal>
							<BottomSheet.Overlay style={styles.overlay} />
							<BottomSheet.Container testID="modal-panel">
								<BottomSheet.Background style={styles.background} />
								<BottomSheet.Handle style={styles.handle}>
									<View style={styles.pill} />
								</BottomSheet.Handle>
								<BottomSheet.Content style={styles.content}>
									<BottomSheet.Title style={styles.title}>Above the modal</BottomSheet.Title>
									<BottomSheet.Description style={styles.description}>
										Teleported to the modal's own host, so it draws over the modal rather than behind it.
									</BottomSheet.Description>
									<BottomSheet.Close style={styles.close} testID="modal-close-sheet">
										<Text style={styles.closeLabel}>Close</Text>
									</BottomSheet.Close>
								</BottomSheet.Content>
							</BottomSheet.Container>
						</BottomSheet.Portal>
					</BottomSheet>
					<Pressable
						accessibilityRole="button"
						onPress={() => setVisible(false)}
						style={styles.modalButton}
						testID="modal-dismiss"
					>
						<Text style={styles.modalButtonLabel}>Dismiss the modal</Text>
					</Pressable>
				</BottomSheet.Host>
			</Modal>
		</View>
	);
}
