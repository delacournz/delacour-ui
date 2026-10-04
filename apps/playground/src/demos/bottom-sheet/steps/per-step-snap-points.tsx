import { BottomSheet, defineSheetMachine, useSheetMachine, useSheetStep } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Per-step snap points",
	caption:
		'A step that names `snapPoints` is sized by them while it is current; one that names none is sized by what it measures. Compact is dynamic, Tall is `["75%"]`, Half is `["50%"]`, and each change glides the sheet to the new step\'s first snap point.',
	capture: { flow: "bottom-sheet/steps/per-step-snap-points", frame: "device" },
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

function Next({ label, testID }: { label: string; testID: string }): ReactElement {
	const { send } = useSheetStep<Step, Record<string, never>, Event>();

	return (
		<Button onPress={() => send({ type: "GO" })} testID={testID}>
			{label}
		</Button>
	);
}

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * a trigger left at the top would sit under the Dynamic Island.
 */
export function Demo(): ReactElement {
	const controller = useSheetMachine(machine);

	return (
		<View className="flex-1 items-center justify-center">
			<BottomSheet>
				<BottomSheet.Trigger asChild>
					<Button testID="steps-snap-open" variant="secondary">
						Open
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container testID="steps-snap-panel">
						<BottomSheet.Steps controller={controller}>
							<BottomSheet.Step name="compact" testID="steps-snap-compact">
								<BottomSheet.Close />
								<BottomSheet.Title>Compact</BottomSheet.Title>
								<BottomSheet.Description>No snap points of its own: sized by this text.</BottomSheet.Description>
								<Next label="Go tall (75%)" testID="steps-snap-to-tall" />
							</BottomSheet.Step>
							<BottomSheet.Step name="tall" testID="steps-snap-tall">
								<BottomSheet.Close />
								<BottomSheet.Title>Tall</BottomSheet.Title>
								<BottomSheet.Description>
									The content is short. The sheet is not — it is 75% of the screen.
								</BottomSheet.Description>
								<Next label="Go half (50%)" testID="steps-snap-to-half" />
							</BottomSheet.Step>
							<BottomSheet.Step name="half" testID="steps-snap-half">
								<BottomSheet.Close />
								<BottomSheet.Title>Half</BottomSheet.Title>
								<BottomSheet.Description>Half the screen. Next goes back to compact.</BottomSheet.Description>
								<Next label="Go compact" testID="steps-snap-to-compact" />
							</BottomSheet.Step>
						</BottomSheet.Steps>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
