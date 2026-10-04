import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useCallback, useState } from "react";
import { type ListRenderItemInfo, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "FlatList, 200 rows",
	caption:
		"Two hundred rows in a `BottomSheet.FlatList`, virtualised as any FlatList is. The list is generic — `data` and `renderItem` check against each other — and the sheet's lock rides the same scroll handler, so a fling at the low snap point goes to the sheet and a fling at the high snap point goes to the rows.",
};

type Row = { id: string; label: string; detail: string };

const SNAP_POINTS = ["50%", "92%"] as const;
const ROW_HEIGHT = 56;
const ROWS: readonly Row[] = Array.from({ length: 200 }, (_, index) => ({
	id: `row-${index + 1}`,
	label: `Row ${index + 1}`,
	detail: index % 7 === 0 ? "Every seventh row says something" : "Nothing to see here",
}));

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
	list: { paddingHorizontal: 16 },
	row: {
		borderBottomColor: "#8E8E9340",
		borderBottomWidth: StyleSheet.hairlineWidth,
		height: ROW_HEIGHT,
		justifyContent: "center",
	},
	rowLabel: { color: "#FFFFFF", fontSize: 15 },
	rowDetail: { color: "#8E8E93", fontSize: 12 },
});

function keyExtractor(row: Row): string {
	return row.id;
}

function getItemLayout(
	_: ArrayLike<Row> | null | undefined,
	index: number
): { length: number; offset: number; index: number } {
	return { length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index };
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [index, setIndex] = useState(-1);

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<Row>) => (
			<View style={styles.row}>
				<Text style={styles.rowLabel}>{item.label}</Text>
				<Text style={styles.rowDetail}>{item.detail}</Text>
			</View>
		),
		[]
	);

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="flat-list-readout">
				{`index: ${index}`}
			</Text>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				onIndexChange={setIndex}
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="flat-list-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="flat-list-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="flat-list-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.FlatList
							contentContainerStyle={styles.list}
							data={ROWS}
							getItemLayout={getItemLayout}
							keyExtractor={keyExtractor}
							renderItem={renderItem}
							testID="flat-list-list"
						/>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
