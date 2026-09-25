import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useCallback, useState } from "react";
import { Pressable, type SectionListData, type SectionListRenderItemInfo, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "SectionList with a sticky footer",
	caption:
		"Three sections of a dozen rows in a `BottomSheet.SectionList`, with sticky section headers, under a sticky footer. The list's bottom margin follows the footer's height, so the last row and the scroll indicator stop above the buttons rather than running under them.",
};

type Row = { id: string; label: string };
type Section = { title: string; data: Row[] };

const SNAP_POINTS = ["40%", "90%"] as const;
const SECTIONS: readonly Section[] = ["Today", "Yesterday", "Earlier"].map((title, group) => ({
	title,
	data: Array.from({ length: 12 }, (_, index) => ({
		id: `${group}-${index}`,
		label: `${title} · item ${index + 1}`,
	})),
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
	header: { backgroundColor: "#2C2C2E", paddingBottom: 6, paddingTop: 12 },
	headerLabel: { color: "#8E8E93", fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
	row: {
		borderBottomColor: "#8E8E9340",
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingVertical: 12,
	},
	rowLabel: { color: "#FFFFFF", fontSize: 15 },
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

function keyExtractor(row: Row): string {
	return row.id;
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [isOpen, setOpen] = useState(false);
	const [answer, setAnswer] = useState("—");

	const choose = (value: string): void => {
		setAnswer(value);
		setOpen(false);
	};

	const renderItem = useCallback(
		({ item }: SectionListRenderItemInfo<Row, Section>) => (
			<View style={styles.row}>
				<Text style={styles.rowLabel}>{item.label}</Text>
			</View>
		),
		[]
	);

	const renderSectionHeader = useCallback(
		({ section }: { section: SectionListData<Row, Section> }) => (
			<View style={styles.header}>
				<Text style={styles.headerLabel}>{section.title}</Text>
			</View>
		),
		[]
	);

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="section-list-readout">
				{`answer: ${answer}`}
			</Text>
			<BottomSheet
				bottomInset={insets.bottom}
				dynamicSizing={false}
				isOpen={isOpen}
				onOpenChange={setOpen}
				snapPoints={SNAP_POINTS}
				topInset={insets.top}
			>
				<BottomSheet.Trigger style={styles.button} testID="section-list-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="section-list-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="section-list-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.SectionList
							contentContainerStyle={styles.list}
							keyExtractor={keyExtractor}
							renderItem={renderItem}
							renderSectionHeader={renderSectionHeader}
							sections={SECTIONS}
							stickySectionHeadersEnabled
							testID="section-list-list"
						/>
						<BottomSheet.Footer padding={16} style={styles.footer} testID="section-list-footer">
							<Pressable
								accessibilityRole="button"
								onPress={() => choose("later")}
								style={[styles.action, styles.cancel]}
								testID="section-list-later"
							>
								<Text style={styles.actionLabel}>Later</Text>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={() => choose("done")}
								style={[styles.action, styles.confirm]}
								testID="section-list-done"
							>
								<Text style={styles.actionLabel}>Mark all read</Text>
							</Pressable>
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
