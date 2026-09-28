import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { createContext, type ReactElement, useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Above the navigator",
	caption:
		"No `inline`, so the portal teleports to the app's `BottomSheetProvider` and the sheet draws over the navigator, the header and the theme trigger rather than inside the demo's box. The context provided around the trigger is read inside the sheet: teleport moves the native view and leaves the React tree where it was.",
};

const SNAP_POINTS = ["45%"] as const;

/** A value provided around the trigger and read inside the portal — proof the tree stayed put. */
const ScreenContext = createContext("not provided");

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
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	readout: { color: "#30D158", fontSize: 14, fontWeight: "600" },
	close: {
		alignSelf: "flex-start",
		backgroundColor: "#30D158",
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	closeLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});

function ContextReadout(): ReactElement {
	const value = useContext(ScreenContext);
	return <Text style={styles.readout} testID="portal-context-readout">{`context: ${value}`}</Text>;
}

export function Demo(): ReactElement {
	return (
		<ScreenContext.Provider value="from the trigger's screen">
			<View style={styles.root}>
				<BottomSheet dynamicSizing={false} snapPoints={SNAP_POINTS}>
					<BottomSheet.Trigger style={styles.button} testID="portal-open">
						<Text style={styles.buttonLabel}>Open over the navigator</Text>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay style={styles.overlay} />
						<BottomSheet.Container testID="portal-panel">
							<BottomSheet.Background style={styles.background} />
							<BottomSheet.Handle style={styles.handle}>
								<View style={styles.pill} />
							</BottomSheet.Handle>
							<BottomSheet.Content style={styles.content}>
								<BottomSheet.Title style={styles.title}>Teleported</BottomSheet.Title>
								<BottomSheet.Description style={styles.description}>
									This sheet is drawn by the root host, over everything the navigator shows.
								</BottomSheet.Description>
								<ContextReadout />
								<BottomSheet.Close style={styles.close} testID="portal-close">
									<Text style={styles.closeLabel}>Close</Text>
								</BottomSheet.Close>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
				<Pressable accessibilityRole="button" style={styles.button}>
					<Text style={styles.buttonLabel}>A button behind the sheet</Text>
				</Pressable>
			</View>
		</ScreenContext.Provider>
	);
}
