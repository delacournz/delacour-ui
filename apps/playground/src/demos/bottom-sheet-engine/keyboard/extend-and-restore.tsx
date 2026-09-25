import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Extend, then restore",
	caption:
		'`keyboardBehavior="extend"` on two explicit detents. Focusing the field snaps the sheet to its highest detent and the keyboard lifts it from there; dismissing the keyboard restores the detent it held before, because `keyboardBlurBehavior` defaults to `restore`. The readout is `onIndexChange`, so the two snaps show up as `keyboard` sources.',
};

const SNAP_POINTS = ["35%", "80%"] as const;

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
	readout: { color: "#8E8E93", fontSize: 13 },
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	input: {
		backgroundColor: "#1C1C1E",
		borderColor: "#8E8E9360",
		borderRadius: 8,
		borderWidth: 1,
		color: "#FFFFFF",
		fontSize: 15,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
});

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [log, setLog] = useState("index: -1");

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="kb-extend-readout">
				{log}
			</Text>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				keyboardBehavior="extend"
				onIndexChange={(index, _height, source) => setLog(`index: ${index} · ${source}`)}
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="kb-extend-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="kb-extend-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="kb-extend-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Extend</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Opens at 35%. Focus the field and the sheet goes to 80% first.
							</BottomSheet.Description>
							<TextInput
								placeholder="Tap to focus"
								placeholderTextColor="#8E8E93"
								style={styles.input}
								testID="kb-extend-input"
							/>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
