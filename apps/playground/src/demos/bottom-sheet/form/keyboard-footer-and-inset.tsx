import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Keyboard, footer and inset",
	caption:
		"A sheet sized to its content, three `BottomSheet.TextInput`s and a sticky footer. Tap any field: the sheet rises by the keyboard's height less the safe-area band, so the footer's bottom lands on the keyboard's top edge and the band under it is the only thing that collapses. Tap the next field and nothing resizes twice; dismiss and the sheet settles back where it was.",
	note: "Closed, the footer sits flush on the home indicator with the safe-area band under its buttons. That band is the engine's `bottomInset`, which this library fills from the safe area — nobody pads for it by hand.",
	keyboardAware: true,
};

type Draft = { name: string; email: string; city: string };
const EMPTY: Draft = { name: "", email: "", city: "" };

/** One labelled, registered field bound to a key of the draft. */
function DraftField({
	draft,
	field,
	label,
	onChange,
	placeholder,
	testID,
}: {
	draft: Draft;
	field: keyof Draft;
	label: string;
	onChange: (next: Draft) => void;
	placeholder: string;
	testID: string;
}): ReactElement {
	return (
		<Field>
			<Field.Label>{label}</Field.Label>
			<BottomSheet.TextInput
				onChangeText={(value) => onChange({ ...draft, [field]: value })}
				placeholder={placeholder}
				testID={testID}
				value={draft[field]}
			/>
		</Field>
	);
}

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [draft, setDraft] = useState<Draft>(EMPTY);

	return (
		<View className="flex-1 items-center justify-center">
			<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
				<BottomSheet.Trigger asChild>
					<Button testID="kb-form-open" variant="secondary">
						New contact
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container testID="kb-form-panel">
						<BottomSheet.Content>
							<BottomSheet.Close />
							<BottomSheet.Title>New contact</BottomSheet.Title>
							<DraftField
								draft={draft}
								field="name"
								label="Full name"
								onChange={setDraft}
								placeholder="Ada Lovelace"
								testID="kb-form-name"
							/>
							<DraftField
								draft={draft}
								field="email"
								label="Email"
								onChange={setDraft}
								placeholder="ada@example.com"
								testID="kb-form-email"
							/>
							<DraftField
								draft={draft}
								field="city"
								label="City"
								onChange={setDraft}
								placeholder="Wellington"
								testID="kb-form-city"
							/>
						</BottomSheet.Content>
						<BottomSheet.Footer sticky testID="kb-form-footer">
							<Button
								onPress={() => {
									setDraft(EMPTY);
									setOpen(false);
								}}
								testID="kb-form-save"
							>
								Save
							</Button>
						</BottomSheet.Footer>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
