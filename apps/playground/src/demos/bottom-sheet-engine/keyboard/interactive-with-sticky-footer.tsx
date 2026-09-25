import { BottomSheet, useBottomSheetTextInput } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Interactive, with a sticky footer",
	caption:
		"The default `keyboardBehavior`. A sheet sized to its content, three fields and a sticky footer. Tap any field: the sheet rides the keyboard up by exactly its height less the safe-area band, so the footer's bottom lands on the keyboard's top edge and the band is the only thing that collapses. Tap the next field and nothing resizes twice. `bottomInset` is the safe-area bottom from `useSafeAreaInsets`.",
};

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
	label: { color: "#8E8E93", fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
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
	footer: { backgroundColor: "#2C2C2E", borderTopColor: "#8E8E9340", borderTopWidth: StyleSheet.hairlineWidth },
	save: { alignItems: "center", backgroundColor: "#30D158", borderRadius: 10, paddingVertical: 12 },
	saveLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});

/** A field of the demo's own, registered through the hook rather than the component. */
function RegisteredField({ testID }: { testID: string }): ReactElement {
	const handlers = useBottomSheetTextInput();
	return (
		<TextInput
			{...handlers}
			placeholder="Registered by hook"
			placeholderTextColor="#8E8E93"
			style={styles.input}
			testID={testID}
		/>
	);
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [saves, setSaves] = useState(0);
	const [isOpen, setOpen] = useState(false);

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="kb-interactive-readout">
				{`saves: ${saves} · bottomInset: ${insets.bottom}`}
			</Text>
			<BottomSheet bottomInset={insets.bottom} isOpen={isOpen} onOpenChange={setOpen} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="kb-interactive-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="kb-interactive-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="kb-interactive-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>New contact</BottomSheet.Title>
							<Text style={styles.label}>Plain TextInput</Text>
							<TextInput
								placeholder="Found by geometry"
								placeholderTextColor="#8E8E93"
								style={styles.input}
								testID="kb-interactive-plain"
							/>
							<Text style={styles.label}>BottomSheet.TextInput</Text>
							<BottomSheet.TextInput
								placeholder="Registered by component"
								placeholderTextColor="#8E8E93"
								style={styles.input}
								testID="kb-interactive-registered"
							/>
							<Text style={styles.label}>useBottomSheetTextInput</Text>
							<RegisteredField testID="kb-interactive-hook" />
						</BottomSheet.Content>
						<BottomSheet.Footer padding={16} style={styles.footer} testID="kb-interactive-footer">
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									setSaves((count) => count + 1);
									setOpen(false);
								}}
								style={styles.save}
								testID="kb-interactive-save"
							>
								<Text style={styles.saveLabel}>Save</Text>
							</Pressable>
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
