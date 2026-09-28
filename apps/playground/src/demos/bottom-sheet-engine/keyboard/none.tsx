import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "None",
	caption:
		'`keyboardBehavior="none"`. The keyboard is not the sheet\'s problem: nothing lifts, nothing snaps, nothing shrinks, and the keyboard covers whatever it covers. For a sheet whose field sits high enough on its own, or one that handles the keyboard itself.',
};

const SNAP_POINTS = ["70%"] as const;

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

	return (
		<View style={styles.root}>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				keyboardBehavior="none"
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="kb-none-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="kb-none-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="kb-none-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>None</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								The field is near the top, so the keyboard never reaches it.
							</BottomSheet.Description>
							<TextInput
								placeholder="Tap to focus"
								placeholderTextColor="#8E8E93"
								style={styles.input}
								testID="kb-none-input"
							/>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
