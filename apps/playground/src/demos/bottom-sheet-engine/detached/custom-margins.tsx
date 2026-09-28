import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom margins",
	caption:
		"`detached` takes an object: `horizontalMargin` insets the card from each side and `bottomOffset` lifts it above the bottom inset. Two explicit detents, as a `%` of the height that is left above the resting line. Close it, pick another preset and open again; the frame is derived on the UI thread from the measured width, so a rotation re-derives it too.",
};

const SNAP_POINTS = ["35%", "70%"] as const;
const PRESETS = [
	{ label: "8 / 8", horizontalMargin: 8, bottomOffset: 8 },
	{ label: "24 / 32", horizontalMargin: 24, bottomOffset: 32 },
	{ label: "48 / 80", horizontalMargin: 48, bottomOffset: 80 },
] as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	button: { backgroundColor: "#8E8E9326", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
	buttonSelected: { backgroundColor: "#30D15833" },
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	readout: { color: "#8E8E93", fontSize: 13 },
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderRadius: 20 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
});

export function Demo(): ReactElement {
	const [preset, setPreset] = useState(1);
	const { horizontalMargin, bottomOffset } = PRESETS[preset] ?? PRESETS[1];

	return (
		<View style={styles.root}>
			<View style={styles.row}>
				{PRESETS.map((candidate, index) => (
					<Pressable
						accessibilityRole="button"
						key={candidate.label}
						onPress={() => setPreset(index)}
						style={[styles.button, index === preset ? styles.buttonSelected : null]}
						testID={`margins-${candidate.horizontalMargin}`}
					>
						<Text style={styles.buttonLabel}>{candidate.label}</Text>
					</Pressable>
				))}
			</View>
			<Text style={styles.readout} testID="margins-readout">
				{`horizontalMargin: ${horizontalMargin} · bottomOffset: ${bottomOffset}`}
			</Text>
			<BottomSheet
				bottomInset={34}
				detached={{ horizontalMargin, bottomOffset }}
				dynamicSizing={false}
				snapPoints={SNAP_POINTS}
			>
				<BottomSheet.Trigger style={styles.button} testID="margins-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="margins-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle}>
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Margins and offset</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Drag the handle up for the second detent. Close, pick another preset, and open again to move the card.
							</BottomSheet.Description>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
