import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Two snap points",
	caption:
		"The sheet the overview's code draws: two explicit snap points, an overlay, a handle and a close button, teleported over the screen. A drag on the handle carries it from the first snap point to the second and back, and a drag past the first closes it.",
	capture: { flow: true, frame: "device" },
};

const SNAP_POINTS = ["40%", "85%"] as const;

const styles = StyleSheet.create({
	root: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", width: "100%" },
	button: { backgroundColor: "#8E8E9326", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
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
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.root}>
			<BottomSheet bottomInset={insets.bottom} dynamicSizing={false} snapPoints={SNAP_POINTS} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="two-snap-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="two-snap-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="two-snap-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Two snap points</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Drag the handle up for the second. Drag past the first to close.
							</BottomSheet.Description>
							<BottomSheet.Close style={styles.close} testID="two-snap-close">
								<Text style={styles.closeLabel}>Close</Text>
							</BottomSheet.Close>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
