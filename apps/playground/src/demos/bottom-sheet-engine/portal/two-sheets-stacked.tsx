import { BottomSheet, type BottomSheetRef, useBottomSheetRegistry } from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Two sheets, stacked",
	caption:
		'The second sheet is opened from inside the first and lands on top of it: the registry stamps each open with a larger `zIndex`. The third opens with `stackBehavior="replace"`, which closes every other sheet in the host first. `Dismiss all` is `useBottomSheetRegistry()`, no ref in hand.',
};

const FIRST = ["40%"] as const;
const SECOND = ["60%"] as const;
const THIRD = ["30%"] as const;

const styles = StyleSheet.create({
	root: { gap: 12, width: "100%" },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	button: {
		alignSelf: "flex-start",
		backgroundColor: "#8E8E9326",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	buttonLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
	overlay: { backgroundColor: "#00000066" },
	first: { backgroundColor: "#2C2C2E", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	second: { backgroundColor: "#3A3A3C", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	third: { backgroundColor: "#1F3A2A", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
	handle: { alignItems: "center", paddingBottom: 8, paddingTop: 10 },
	pill: { backgroundColor: "#8E8E93", borderRadius: 2, height: 4, width: 36 },
	content: { gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	accent: {
		alignSelf: "flex-start",
		backgroundColor: "#30D158",
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	accentLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});

function DismissAll(): ReactElement {
	const { dismissAll } = useBottomSheetRegistry();
	return (
		<BottomSheet.Close asChild>
			<Text onPress={dismissAll} style={styles.accentLabel} testID="stack-dismiss-all">
				Dismiss all
			</Text>
		</BottomSheet.Close>
	);
}

export function Demo(): ReactElement {
	const second = useRef<BottomSheetRef>(null);
	const third = useRef<BottomSheetRef>(null);

	return (
		<View style={styles.root}>
			<BottomSheet dynamicSizing={false} snapPoints={FIRST}>
				<BottomSheet.Trigger style={styles.button} testID="stack-open-first">
					<Text style={styles.buttonLabel}>Open the first</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="stack-first">
						<BottomSheet.Background style={styles.first} />
						<BottomSheet.Handle style={styles.handle}>
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>First sheet</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Open the second from here. It stacks on top; this one stays where it is.
							</BottomSheet.Description>
							<View style={styles.row}>
								<Text onPress={() => second.current?.open()} style={styles.accent} testID="stack-open-second">
									Open the second
								</Text>
								<Text onPress={() => third.current?.open()} style={styles.accent} testID="stack-open-third">
									Replace with the third
								</Text>
							</View>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>

			<BottomSheet dynamicSizing={false} ref={second} snapPoints={SECOND}>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="stack-second">
						<BottomSheet.Background style={styles.second} />
						<BottomSheet.Handle style={styles.handle}>
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Second sheet</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Later open, larger z. The first is still open under this one.
							</BottomSheet.Description>
							<View style={styles.accent}>
								<DismissAll />
							</View>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>

			<BottomSheet dynamicSizing={false} ref={third} snapPoints={THIRD} stackBehavior="replace">
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="stack-third">
						<BottomSheet.Background style={styles.third} />
						<BottomSheet.Handle style={styles.handle}>
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Content style={styles.content}>
							<BottomSheet.Title style={styles.title}>Third sheet, replace</BottomSheet.Title>
							<BottomSheet.Description style={styles.description}>
								Opening this closed the others in the host. Nothing is under it.
							</BottomSheet.Description>
							<BottomSheet.Close style={styles.accent} testID="stack-close-third">
								<Text style={styles.accentLabel}>Close</Text>
							</BottomSheet.Close>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
