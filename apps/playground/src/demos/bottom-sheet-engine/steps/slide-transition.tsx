import { BottomSheet, defineSheetMachine, useSheetMachine, useSheetStep } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Slide transition",
	caption:
		'`transition="slide"`: the incoming step arrives from the side the direction points away from and the outgoing one leaves the other way, a container width each. Forward slides left, back slides right — `direction` is the machine\'s declaration order unless a state says otherwise. The height still glides; the third page is taller than the first two.',
};

type Step = "one" | "two" | "three";
type Event = { type: "NEXT" } | { type: "BACK" };

const machine = defineSheetMachine<Step, Record<string, never>, Event>({
	initial: "one",
	context: {},
	states: {
		one: { on: { NEXT: "two" } },
		two: { on: { NEXT: "three", BACK: "one" } },
		three: { on: { BACK: "two" } },
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
	step: { gap: 12, paddingBottom: 16, paddingTop: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
	block: { backgroundColor: "#1C1C1E", borderRadius: 8, height: 120 },
	row: { flexDirection: "row", gap: 8 },
	action: { alignItems: "center", backgroundColor: "#30D158", borderRadius: 10, flex: 1, paddingVertical: 12 },
	actionSecondary: { backgroundColor: "#8E8E9326" },
	actionLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});

function Nav({ testID }: { testID: string }): ReactElement {
	const { send, can } = useSheetStep<Step, Record<string, never>, Event>();
	return (
		<View style={styles.row}>
			{can({ type: "BACK" }) ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => send({ type: "BACK" })}
					style={[styles.action, styles.actionSecondary]}
					testID={`${testID}-back`}
				>
					<Text style={styles.actionLabel}>Back</Text>
				</Pressable>
			) : null}
			{can({ type: "NEXT" }) ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => send({ type: "NEXT" })}
					style={styles.action}
					testID={`${testID}-next`}
				>
					<Text style={styles.actionLabel}>Next</Text>
				</Pressable>
			) : null}
		</View>
	);
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const controller = useSheetMachine(machine);

	return (
		<View style={styles.root}>
			<BottomSheet bottomInset={insets.bottom} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="steps-slide-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} />
					<BottomSheet.Container testID="steps-slide-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="steps-slide-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Steps controller={controller} style={styles.steps} transition="slide">
							<BottomSheet.Step name="one" style={styles.step} testID="steps-slide-one">
								<BottomSheet.Title style={styles.title}>Page one</BottomSheet.Title>
								<Text style={styles.description}>Next slides this page out to the left.</Text>
								<Nav testID="steps-slide-one" />
							</BottomSheet.Step>
							<BottomSheet.Step name="two" style={styles.step} testID="steps-slide-two">
								<Text style={styles.title}>Page two</Text>
								<Text style={styles.description}>Back slides it out to the right instead.</Text>
								<Nav testID="steps-slide-two" />
							</BottomSheet.Step>
							<BottomSheet.Step name="three" style={styles.step} testID="steps-slide-three">
								<Text style={styles.title}>Page three</Text>
								<Text style={styles.description}>Taller than the others, so the sheet grows as it arrives.</Text>
								<View style={styles.block} />
								<Nav testID="steps-slide-three" />
							</BottomSheet.Step>
						</BottomSheet.Steps>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
