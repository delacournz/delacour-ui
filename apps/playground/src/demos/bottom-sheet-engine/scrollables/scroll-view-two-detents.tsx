import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useCallback, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "ScrollView, two detents",
	caption:
		"Thirty rows in a `BottomSheet.ScrollView` behind two explicit detents. At the low detent a swipe up inside the list moves the sheet, not the rows, and the indicator stays hidden; at the high detent the same swipe scrolls. A drag down at the top of the list brings the sheet with it, and a drag down from further in scrolls the list back to the top first. The readout is the consumer's own `onScroll`, called on the JS thread.",
	capture: { flow: "bottom-sheet-engine/scrollables/scroll-view-two-detents", frame: "device" },
};

const SNAP_POINTS = ["45%", "90%"] as const;
const ROWS = Array.from({ length: 30 }, (_, index) => `Row ${index + 1}`);

const styles = StyleSheet.create({
	root: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", width: "100%" },
	button: {
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
	list: { paddingHorizontal: 16 },
	row: {
		borderBottomColor: "#8E8E9340",
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingVertical: 14,
	},
	rowLabel: { color: "#FFFFFF", fontSize: 15 },
});

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [index, setIndex] = useState(-1);
	const [offset, setOffset] = useState(0);

	const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		setOffset(Math.round(event.nativeEvent.contentOffset.y));
	}, []);

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="scroll-view-readout">
				{`index: ${index} · offset: ${offset}`}
			</Text>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				onIndexChange={setIndex}
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="scroll-view-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="scroll-view-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="scroll-view-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.ScrollView contentContainerStyle={styles.list} onScroll={onScroll} testID="scroll-view-list">
							{ROWS.map((label) => (
								<View key={label} style={styles.row}>
									<Text style={styles.rowLabel}>{label}</Text>
								</View>
							))}
						</BottomSheet.ScrollView>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
