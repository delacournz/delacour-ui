import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { type Question, Questionnaire } from "@delacour/react-native-ui/questionnaire";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Unframed, in a sheet",
	caption:
		"`isFramed={false}` drops the card for a bare column the sheet's own gutter frames. Submitting closes the sheet from `onSubmit`.",
	capture: { flow: true, frame: "device" },
};

const QUESTIONS: readonly Question[] = [
	{
		id: "reason",
		isRequired: true,
		kind: "single",
		options: [
			{ label: "Too expensive", value: "price" },
			{ label: "Missing a feature", value: "feature" },
			{ label: "Switching to something else", value: "switching" },
		],
		title: "Why are you cancelling?",
	},
	{ id: "return", kind: "yesNo", title: "Would you come back if that changed?" },
];

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
		<View className="flex-1 items-center justify-center">
			<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
				<BottomSheet.Trigger asChild>
					<Button testID="questionnaire-open-sheet" variant="secondary">
						Cancel subscription
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Close testID="questionnaire-close-sheet" />
							<BottomSheet.Title>Before you go</BottomSheet.Title>
							<Questionnaire isFramed={false} onSubmit={() => setOpen(false)} questions={QUESTIONS} testID="cancel">
								<Questionnaire.Progress variant="steps" />
								<Questionnaire.Question />
								<Questionnaire.Footer />
							</Questionnaire>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
