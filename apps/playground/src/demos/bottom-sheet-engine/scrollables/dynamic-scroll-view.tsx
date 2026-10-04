import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dynamic ScrollView",
	caption:
		"No `snapPoints`, no `dynamicSizing={false}`. The `BottomSheet.ScrollView` reports its content size and that is the sheet's one snap point: six rows make a short sheet, forty make one capped at `maxDynamicContentSize` that scrolls inside the cap. Toggle the count while it is open and the sheet animates between the two heights.",
};

const SHORT = 6;
const LONG = 40;
const MAX_DYNAMIC_CONTENT_SIZE = 420;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	button: { backgroundColor: "#8E8E9326", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	readout: { color: "#8E8E93", fontSize: 13 },
	overlay: { backgroundColor: "#00000099" },
	background: { backgroundColor: "#2C2C2E", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	list: { paddingHorizontal: 16 },
	toggle: {
		alignSelf: "flex-start",
		backgroundColor: "#30D158",
		borderRadius: 8,
		marginVertical: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	toggleLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
	item: {
		borderBottomColor: "#8E8E9340",
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingVertical: 12,
	},
	itemLabel: { color: "#FFFFFF", fontSize: 15 },
});

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [count, setCount] = useState(SHORT);
	const [index, setIndex] = useState(-1);
	const rows = Array.from({ length: count }, (_, position) => `Row ${position + 1}`);

	return (
		<View style={styles.root}>
			<View style={styles.row}>
				<Pressable
					accessibilityRole="button"
					onPress={() => setCount(SHORT)}
					style={styles.button}
					testID="dynamic-scroll-short"
				>
					<Text style={styles.buttonLabel}>{`${SHORT} rows`}</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					onPress={() => setCount(LONG)}
					style={styles.button}
					testID="dynamic-scroll-long"
				>
					<Text style={styles.buttonLabel}>{`${LONG} rows`}</Text>
				</Pressable>
			</View>
			<Text style={styles.readout} testID="dynamic-scroll-readout">
				{`rows: ${count} · index: ${index}`}
			</Text>
			<BottomSheet
				bottomInset={insets.bottom}
				maxDynamicContentSize={MAX_DYNAMIC_CONTENT_SIZE}
				onIndexChange={setIndex}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="dynamic-scroll-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="dynamic-scroll-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="dynamic-scroll-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.ScrollView contentContainerStyle={styles.list} testID="dynamic-scroll-list">
							<Pressable
								accessibilityRole="button"
								onPress={() => setCount((current) => (current === SHORT ? LONG : SHORT))}
								style={styles.toggle}
								testID="dynamic-scroll-toggle"
							>
								<Text style={styles.toggleLabel}>{count === SHORT ? `Show ${LONG}` : `Show ${SHORT}`}</Text>
							</Pressable>
							{rows.map((label) => (
								<View key={label} style={styles.item}>
									<Text style={styles.itemLabel}>{label}</Text>
								</View>
							))}
						</BottomSheet.ScrollView>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
