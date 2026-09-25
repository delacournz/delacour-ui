import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sticky, on a short sheet",
	caption:
		"A sheet sized to its content with a sticky footer and no keyboard in sight. The footer's height is part of the dynamic detent — handle, content, footer, then the safe-area band once — so the buttons sit fully above the home indicator rather than on it, and the content's last line clears them.",
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
	content: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	footer: {
		backgroundColor: "#2C2C2E",
		borderTopColor: "#8E8E9340",
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: "row",
		gap: 8,
	},
	action: { alignItems: "center", borderRadius: 10, flex: 1, paddingVertical: 12 },
	cancel: { backgroundColor: "#8E8E9326" },
	confirm: { backgroundColor: "#30D158" },
	actionLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [isOpen, setOpen] = useState(false);
	const [answer, setAnswer] = useState("—");

	const choose = (value: string): void => {
		setAnswer(value);
		setOpen(false);
	};

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="footer-short-readout">
				{`answer: ${answer}`}
			</Text>
			<BottomSheet bottomInset={insets.bottom} isOpen={isOpen} onOpenChange={setOpen} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="footer-short-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="footer-short-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="footer-short-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Discard changes?</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Two lines of copy and a footer. The whole sheet is as tall as the four of them.
							</BottomSheet.Description>
						</BottomSheet.Content>
						<BottomSheet.Footer padding={16} style={styles.footer} testID="footer-short-footer">
							<Pressable
								accessibilityRole="button"
								onPress={() => choose("keep")}
								style={[styles.action, styles.cancel]}
								testID="footer-short-keep"
							>
								<Text style={styles.actionLabel}>Keep</Text>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={() => choose("discard")}
								style={[styles.action, styles.confirm]}
								testID="footer-short-discard"
							>
								<Text style={styles.actionLabel}>Discard</Text>
							</Pressable>
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
