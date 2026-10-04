import {
	BottomSheet,
	defineSheetMachine,
	useBottomSheet,
	useSheetMachine,
	useSheetStep,
} from "@delacour/react-native-bottom-sheet";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Three-step form",
	caption:
		'Details, confirm, success — one `defineSheetMachine`, one `BottomSheet.Steps`. NEXT stays disabled until the guard passes, and the sheet\'s height glides to each step rather than jumping: the step measures, the dynamic snap point moves, and the panel follows with the same spring the body is using. The confirm step is `dismissible: false`, so a swipe down and a tap on the scrim do nothing there; the success step names `snapPoints: ["35%"]` and is sized by them. Closing resets the machine, so the next open starts at details.',
	keyboardAware: true,
	capture: { flow: "bottom-sheet-engine/steps/three-step-form", frame: "device" },
};

type Step = "details" | "confirm" | "success";
type Context = { name: string; email: string };
type Event =
	| { type: "NEXT" }
	| { type: "BACK" }
	| { type: "SUBMIT" }
	| { type: "EDIT"; field: keyof Context; value: string };

const EMAIL = /^\S+@\S+\.\S+$/;

const machine = defineSheetMachine<Step, Context, Event>({
	id: "signup",
	initial: "details",
	context: { name: "", email: "" },
	states: {
		details: {
			on: {
				NEXT: { target: "confirm", guard: (context) => context.name.trim().length > 0 && EMAIL.test(context.email) },
				EDIT: { target: "details", assign: (context, event) => ({ ...context, [event.field]: event.value }) },
			},
		},
		confirm: {
			dismissible: false,
			on: { BACK: "details", SUBMIT: "success" },
		},
		success: {
			snapPoints: ["35%"],
			dismissible: true,
		},
	},
});

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
	steps: { paddingHorizontal: 16 },
	step: { gap: 12, paddingVertical: 8 },
	title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
	description: { color: "#8E8E93", fontSize: 14 },
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
	summary: { backgroundColor: "#1C1C1E", borderRadius: 8, gap: 6, padding: 12 },
	summaryLine: { color: "#FFFFFF", fontSize: 15 },
	tick: { color: "#30D158", fontSize: 40, fontWeight: "700" },
	footer: { backgroundColor: "#2C2C2E", borderTopColor: "#8E8E9340", borderTopWidth: StyleSheet.hairlineWidth },
	actions: { flexDirection: "row", gap: 8 },
	action: { alignItems: "center", backgroundColor: "#30D158", borderRadius: 10, flex: 1, paddingVertical: 12 },
	actionSecondary: { backgroundColor: "#8E8E9326" },
	actionDisabled: { opacity: 0.4 },
	actionLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});

type ActionProps = { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID: string };

function Action({ label, onPress, disabled = false, secondary = false, testID }: ActionProps): ReactElement {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={[styles.action, secondary && styles.actionSecondary, disabled && styles.actionDisabled]}
			testID={testID}
		>
			<Text style={styles.actionLabel}>{label}</Text>
		</Pressable>
	);
}

/** The footer's row: which buttons show is the step, read through `useSheetStep`. */
function StepActions(): ReactElement {
	const { send, can, matches } = useSheetStep<Step, Context, Event>();
	const { close } = useBottomSheet();
	if (matches("details")) {
		return (
			<View style={styles.actions}>
				<Action
					disabled={!can({ type: "NEXT" })}
					label="Next"
					onPress={() => send({ type: "NEXT" })}
					testID="steps-form-next"
				/>
			</View>
		);
	}
	if (matches("confirm")) {
		return (
			<View style={styles.actions}>
				<Action label="Back" onPress={() => send({ type: "BACK" })} secondary testID="steps-form-back" />
				<Action label="Submit" onPress={() => send({ type: "SUBMIT" })} testID="steps-form-submit" />
			</View>
		);
	}
	return (
		<View style={styles.actions}>
			<Action label="Done" onPress={close} testID="steps-form-done" />
		</View>
	);
}

/** The details step's two fields, editing the machine's context. */
function DetailsFields(): ReactElement {
	const { context, send } = useSheetStep<Step, Context, Event>();
	return (
		<>
			<Text style={styles.label}>Name</Text>
			<BottomSheet.TextInput
				autoCapitalize="words"
				onChangeText={(value) => send({ type: "EDIT", field: "name", value })}
				placeholder="Ada Lovelace"
				placeholderTextColor="#8E8E93"
				style={styles.input}
				testID="steps-form-name"
				value={context.name}
			/>
			<Text style={styles.label}>Email</Text>
			<BottomSheet.TextInput
				autoCapitalize="none"
				keyboardType="email-address"
				onChangeText={(value) => send({ type: "EDIT", field: "email", value })}
				placeholder="ada@example.com"
				placeholderTextColor="#8E8E93"
				style={styles.input}
				testID="steps-form-email"
				value={context.email}
			/>
		</>
	);
}

function Summary(): ReactElement {
	const { context } = useSheetStep<Step, Context, Event>();
	return (
		<View style={styles.summary}>
			<Text style={styles.summaryLine}>{context.name}</Text>
			<Text style={styles.summaryLine}>{context.email}</Text>
		</View>
	);
}

export function Demo(): ReactElement {
	const insets = useSafeAreaInsets();
	const [isOpen, setOpen] = useState(false);
	const [log, setLog] = useState("details");
	const controller = useSheetMachine(machine, {
		onTransition: (_from, to) => setLog(to.value),
		onRejected: (error) => setLog(`${error.code} on ${error.event}`),
	});

	return (
		<View style={styles.root}>
			<Text style={styles.readout} testID="steps-form-readout">
				{`step: ${controller.value} · last: ${log}`}
			</Text>
			<BottomSheet bottomInset={insets.bottom} isOpen={isOpen} onOpenChange={setOpen} topInset={insets.top}>
				<BottomSheet.Trigger style={styles.button} testID="steps-form-open">
					<Text style={styles.buttonLabel}>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay style={styles.overlay} testID="steps-form-overlay" />
					<BottomSheet.Container testID="steps-form-panel">
						<BottomSheet.Background style={styles.background} />
						<BottomSheet.Handle style={styles.handle} testID="steps-form-handle">
							<View style={styles.pill} />
						</BottomSheet.Handle>
						<BottomSheet.Steps controller={controller} style={styles.steps}>
							<BottomSheet.Step name="details" style={styles.step} testID="steps-form-details">
								<BottomSheet.Title style={styles.title}>Your details</BottomSheet.Title>
								<BottomSheet.Description style={styles.description}>
									Next unlocks once both fields pass the guard.
								</BottomSheet.Description>
								<DetailsFields />
							</BottomSheet.Step>
							<BottomSheet.Step name="confirm" style={styles.step} testID="steps-form-confirm">
								<Text style={styles.title}>Confirm</Text>
								<Text style={styles.description}>
									This step is not dismissible: a swipe down or a tap on the scrim does nothing.
								</Text>
								<Summary />
							</BottomSheet.Step>
							<BottomSheet.Step name="success" style={styles.step} testID="steps-form-success">
								<Text style={styles.tick}>✓</Text>
								<Text style={styles.title}>You are in</Text>
								<Text style={styles.description}>This step is sized by its own `snapPoints: ["35%"]`.</Text>
							</BottomSheet.Step>
						</BottomSheet.Steps>
						<BottomSheet.Footer padding={16} style={styles.footer} testID="steps-form-footer">
							<StepActions />
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
