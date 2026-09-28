import { BottomSheet, defineSheetMachine, useSheetMachine, useSheetStep } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Per-step snap points",
	caption:
		'A step that names `snapPoints` is sized by them while it is current, and dynamic sizing is off for it; a step that names none is sized by what it measures. Compact is dynamic, Tall is `["75%"]`, Half is `["50%"]`. Each change animates the sheet to the new step\'s first detent.',
};

type Step = "compact" | "tall" | "half";
type Event = { type: "GO" };

/** `GO` walks the three steps in a ring, so one button per step is the whole UI. */
const machine = defineSheetMachine<Step, Record<string, never>, Event>({
	initial: "compact",
	context: {},
	states: {
		compact: { on: { GO: "tall" } },
		tall: { snapPoints: ["75%"], on: { GO: "half" } },
		half: { snapPoints: ["50%"], on: { GO: "compact" } },
	},
});

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
	steps: { paddingHorizontal: 16 },
	step: { gap: 12, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	next: { alignItems: "center", backgroundColor: "#30D158", borderRadius: 10, paddingVertical: 12 },
	nextLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});

function Next({ label, testID }: { label: string; testID: string }): ReactElement {
	const { send } = useSheetStep<Step, Record<string, never>, Event>();
	return (
		<Pressable accessibilityRole="button" onPress={() => send({ type: "GO" })} style={styles.next} testID={testID}>
			<Text style={styles.nextLabel}>{label}</Text>
		</Pressable>
	);
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const controller = useSheetMachine(machine);

	return (
		<View style={styles.root}>
			<BottomSheet bottomInset={insets.bottom} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="steps-snap-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="steps-snap-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="steps-snap-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Steps controller={controller} style={styles.steps}>
							<BottomSheet.Step name="compact" style={styles.step} testID="steps-snap-compact">
								<BottomSheet.Title style={styles.title}>Compact</BottomSheet.Title>
								<Text style={styles.description}>No snap points of its own: sized by this text.</Text>
								<Next label="Go tall (75%)" testID="steps-snap-to-tall" />
							</BottomSheet.Step>
							<BottomSheet.Step name="tall" style={styles.step} testID="steps-snap-tall">
								<Text style={styles.title}>Tall</Text>
								<Text style={styles.description}>`snapPoints: ["75%"]` — the content is short, the sheet is not.</Text>
								<Next label="Go half (50%)" testID="steps-snap-to-half" />
							</BottomSheet.Step>
							<BottomSheet.Step name="half" style={styles.step} testID="steps-snap-half">
								<Text style={styles.title}>Half</Text>
								<Text style={styles.description}>`snapPoints: ["50%"]`. Next goes back to compact.</Text>
								<Next label="Go compact" testID="steps-snap-to-compact" />
							</BottomSheet.Step>
						</BottomSheet.Steps>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
