import {
	BottomSheet,
	defineSheetMachine,
	useBottomSheet,
	useSheetMachine,
	useSheetStep,
} from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Three-step form",
	caption:
		"Details, confirm, done — one `defineSheetMachine`, one `BottomSheet.Steps`, a `Step` per state. Next stays disabled until the guard passes, and the sheet's height glides to each step rather than jumping. The confirm step is `dismissible: false`, so a swipe down or a tap on the scrim does nothing there. Closing resets the machine.",
	note: "The footer is outside the body and still knows which step it is on: `useSheetStep()` reads the same controller `Steps` was given.",
	keyboardAware: true,
};

type Step = "details" | "confirm" | "done";
type Context = { name: string; email: string };
type Event =
	| { type: "NEXT" }
	| { type: "BACK" }
	| { type: "SUBMIT" }
	| { type: "EDIT"; field: keyof Context; value: string };

const EMAIL = /^\S+@\S+\.\S+$/;

const machine = defineSheetMachine<Step, Context, Event>({
	id: "invite",
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
			on: { BACK: "details", SUBMIT: "done" },
		},
		done: {
			dismissible: true,
		},
	},
});

/** The details step's two fields, editing the machine's context through `EDIT`. */
function DetailsFields(): ReactElement {
	const { context, send } = useSheetStep<Step, Context, Event>();

	return (
		<>
			<Field>
				<Field.Label>Name</Field.Label>
				<BottomSheet.TextInput
					autoCapitalize="words"
					onChangeText={(value) => send({ type: "EDIT", field: "name", value })}
					placeholder="Ada Lovelace"
					testID="steps-form-name"
					value={context.name}
				/>
			</Field>
			<Field>
				<Field.Label>Email</Field.Label>
				<BottomSheet.TextInput
					autoCapitalize="none"
					keyboardType="email-address"
					onChangeText={(value) => send({ type: "EDIT", field: "email", value })}
					placeholder="ada@example.com"
					testID="steps-form-email"
					value={context.email}
				/>
			</Field>
		</>
	);
}

function Summary(): ReactElement {
	const { context } = useSheetStep<Step, Context, Event>();

	return (
		<View className="gap-1 rounded-lg bg-muted p-3">
			<Text>{context.name}</Text>
			<Text color="muted">{context.email}</Text>
		</View>
	);
}

/** The footer's row — which buttons show is the step, read through `useSheetStep`. */
function StepActions(): ReactElement {
	const { send, can, matches } = useSheetStep<Step, Context, Event>();
	const { close } = useBottomSheet();

	if (matches("details")) {
		return (
			<Button isDisabled={!can({ type: "NEXT" })} onPress={() => send({ type: "NEXT" })} testID="steps-form-next">
				Next
			</Button>
		);
	}
	if (matches("confirm")) {
		return (
			<View className="flex-row gap-2">
				<Button className="flex-1" onPress={() => send({ type: "BACK" })} testID="steps-form-back" variant="secondary">
					Back
				</Button>
				<Button className="flex-1" onPress={() => send({ type: "SUBMIT" })} testID="steps-form-submit">
					Send invite
				</Button>
			</View>
		);
	}
	return (
		<Button onPress={close} testID="steps-form-done">
			Done
		</Button>
	);
}

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const controller = useSheetMachine(machine);

	return (
		<View className="flex-1 items-center justify-center gap-3">
			<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
				<BottomSheet.Trigger asChild>
					<Button testID="steps-form-open" variant="secondary">
						Invite someone
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container testID="steps-form-panel">
						<BottomSheet.Steps controller={controller}>
							<BottomSheet.Step name="details" testID="steps-form-details">
								<BottomSheet.Title>Who are you inviting?</BottomSheet.Title>
								<BottomSheet.Description>Next unlocks once both fields pass.</BottomSheet.Description>
								<DetailsFields />
							</BottomSheet.Step>
							<BottomSheet.Step name="confirm" testID="steps-form-confirm">
								<BottomSheet.Title>Send this invite?</BottomSheet.Title>
								<BottomSheet.Description>This step cannot be dismissed. Go back, or send it.</BottomSheet.Description>
								<Summary />
							</BottomSheet.Step>
							<BottomSheet.Step name="done" testID="steps-form-success">
								<BottomSheet.Title>Invite sent</BottomSheet.Title>
								<BottomSheet.Description>They will get an email in the next minute or so.</BottomSheet.Description>
							</BottomSheet.Step>
						</BottomSheet.Steps>
						<BottomSheet.Footer sticky testID="steps-form-footer">
							<StepActions />
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
			<Text.Caption color="muted" testID="steps-form-readout">
				{`Step: ${controller.value}`}
			</Text.Caption>
		</View>
	);
}
