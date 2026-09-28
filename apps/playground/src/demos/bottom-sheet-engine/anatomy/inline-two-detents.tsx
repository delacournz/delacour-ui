import { BottomSheet, type BottomSheetRef } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline, two detents",
	caption:
		"The engine with nothing themed in front of it: two explicit detents, a handle, an overlay, a field and a close button, rendered in place inside a stage. The counter under the stage counts every close — swipe, scrim, button or ref — because `onOpenChange` is the only callback there is.",
	keyboardAware: true,
};

const SNAP_POINTS = ["40%", "85%"] as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	button: { backgroundColor: "#8E8E9326", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	readout: { color: "#8E8E93", fontSize: 13 },
	stage: {
		backgroundColor: "#1C1C1E",
		borderColor: "#8E8E9340",
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		height: 520,
		overflow: "hidden",
		width: "100%",
	},
	stageLabel: { color: "#8E8E93", fontSize: 13, padding: 16 },
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
	close: {
		alignSelf: "flex-start",
		backgroundColor: "#30D158",
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	closeLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});

type ButtonProps = { label: string; onPress: () => void; testID: string };

function Button({ label, onPress, testID }: ButtonProps): ReactElement {
	return (
		<Pressable accessibilityRole="button" onPress={onPress} style={styles.button} testID={testID}>
			<Text style={styles.buttonLabel}>{label}</Text>
		</Pressable>
	);
}

export function Demo(): ReactElement {
	const sheet = useRef<BottomSheetRef>(null);
	const [closes, setCloses] = useState(0);
	const [index, setIndex] = useState(-1);
	const [value, setValue] = useState("");

	const onOpenChange = useCallback((isOpen: boolean) => {
		if (!isOpen) setCloses((count) => count + 1);
	}, []);

	return (
		<View style={styles.root}>
			<View style={styles.row}>
				<Button label="Expand" onPress={() => sheet.current?.expand()} testID="engine-expand" />
				<Button label="Collapse" onPress={() => sheet.current?.collapse()} testID="engine-collapse" />
				<Button label="Snap 1" onPress={() => sheet.current?.snapToIndex(1)} testID="engine-snap-1" />
				<Button label="Close (ref)" onPress={() => sheet.current?.close()} testID="engine-close-ref" />
				<Button label="Dismiss (ref)" onPress={() => sheet.current?.dismiss()} testID="engine-dismiss-ref" />
			</View>
			<Text style={styles.readout} testID="engine-readout">
				{`closes: ${closes} · index: ${index}`}
			</Text>
			<BottomSheet
				dynamicSizing={false}
				onIndexChange={setIndex}
				onOpenChange={onOpenChange}
				ref={sheet}
				snapPoints={SNAP_POINTS}
			>
				<View style={styles.stage}>
					<Text style={styles.stageLabel}>The stage. The sheet lives inside this box.</Text>
					<BottomSheet.Trigger asChild>
						<Button label="Open" onPress={() => {}} testID="engine-open" />
					</BottomSheet.Trigger>
					<BottomSheet.Portal inline>
						<BottomSheet.Overlay style={styles.overlay} />
						<BottomSheet.Container testID="engine-panel">
							<BottomSheet.Background style={styles.background} />
							<BottomSheet.Handle style={styles.handle} testID="engine-handle">
								<View style={styles.pill} />
							</BottomSheet.Handle>
							<BottomSheet.Content style={styles.content}>
								<BottomSheet.Title style={styles.title}>Two detents</BottomSheet.Title>
								<BottomSheet.Description style={styles.description}>
									Drag the handle up for the second. Drag past the first to close.
								</BottomSheet.Description>
								<TextInput
									onChangeText={setValue}
									placeholder="Tap to focus"
									placeholderTextColor="#8E8E93"
									style={styles.input}
									testID="engine-input"
									value={value}
								/>
								<BottomSheet.Close style={styles.close} testID="engine-close">
									<Text style={styles.closeLabel}>Close</Text>
								</BottomSheet.Close>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</View>
			</BottomSheet>
		</View>
	);
}
