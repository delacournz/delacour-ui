import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Floating card",
	caption:
		"`detached` floats the sheet as a card: 16 in from each side, 16 above the bottom inset, every corner the `Background`'s to round. Closed is fully off-screen, and a tap in the margins or the gap under the card closes it — the overlay covers the whole frame.",
	capture: { flow: "bottom-sheet-engine/detached/floating-card", frame: "device", hero: true },
};

const styles = StyleSheet.create({
	root: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", width: "100%" },
	button: {
		backgroundColor: "#8E8E9326",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderRadius: 24 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingBottom: 20, paddingHorizontal: 20, paddingTop: 4 },
	title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
	description: { color: "#8E8E93", fontSize: 15, lineHeight: 21 },
	primary: { alignItems: "center", backgroundColor: "#30D158", borderRadius: 12, paddingVertical: 14 },
	primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
	captionRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
	caption: { color: "#636366", fontSize: 12 },
});

export function Demo(): ReactElement {
	return (
		<View style={styles.root}>
			<BottomSheet bottomInset={34} detached>
				<BottomSheet.Trigger style={styles.button} testID="detached-open">
					<Text style={styles.buttonLabel}>Open a floating card</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="detached-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle}>
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Turn on notifications?</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								A card that floats above the safe area, with room on every side. Tap outside it to close.
							</BottomSheet.Description>
							<BottomSheet.Close style={styles.primary} testID="detached-close">
								<Text style={styles.primaryLabel}>Allow</Text>
							</BottomSheet.Close>
							<View style={styles.captionRow}>
								<Text style={styles.caption}>You can change this later</Text>
								<Text style={styles.caption}>Settings › Notifications</Text>
							</View>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
