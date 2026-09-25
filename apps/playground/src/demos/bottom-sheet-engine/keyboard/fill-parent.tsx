import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Fill the parent",
	caption:
		'`keyboardBehavior="fillParent"`. Focusing the field snaps the sheet to the top of its container and the keyboard does not lift it further: the body is given exactly the space above the keyboard and shrinks to fit, which is what the striped filler shows. Dismiss to restore.',
};

const SNAP_POINTS = ["40%"] as const;

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
	content: { flex: 1, gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
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
	filler: {
		alignItems: "center",
		backgroundColor: "#8E8E9314",
		borderColor: "#8E8E9340",
		borderRadius: 8,
		borderStyle: "dashed",
		borderWidth: 1,
		flex: 1,
		justifyContent: "center",
	},
	fillerLabel: { color: "#8E8E93", fontSize: 13 },
});

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.root}>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				keyboardBehavior="fillParent"
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="kb-fill-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="kb-fill-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="kb-fill-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Fill parent</BottomSheet.Title>
							<TextInput
								placeholder="Tap to focus"
								placeholderTextColor="#8E8E93"
								style={styles.input}
								testID="kb-fill-input"
							/>
							<View style={styles.filler} testID="kb-fill-filler">
								<Text style={styles.fillerLabel}>This box is whatever is left above the keyboard</Text>
							</View>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
