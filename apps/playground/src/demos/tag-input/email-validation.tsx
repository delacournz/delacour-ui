import { Field } from "@delacour/react-native-ui/field";
import { TagInput, type TagInputRejectReason } from "@delacour/react-native-ui/tag-input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Email validation",
	caption:
		"Comma, space and semicolon all commit, so a pasted list of addresses lands as several chips. An address `validate` refuses stays in the field to be corrected, and `onReject` says why.",
	keyboardAware: true,
};

const HINTS: Record<TagInputRejectReason, string> = {
	duplicate: "That address is already on the list.",
	empty: "Type an address first.",
	invalid: "That does not look like an email address.",
	max: "The list is full.",
};

const DELIMITERS = [",", " ", ";"];

/** Loose on purpose: a demo of the hook, not of address validation. */
function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function Demo(): ReactElement {
	const [emails, setEmails] = useState<string[]>(["aroha@delacour.co.nz"]);
	const [hint, setHint] = useState<string | null>(null);

	return (
		<Field isInvalid={hint !== null}>
			<Field.Label>Recipients</Field.Label>
			<TagInput
				delimiters={DELIMITERS}
				keyboardType="email-address"
				onInputValueChange={() => setHint(null)}
				onReject={({ reason }) => setHint(HINTS[reason])}
				onValueChange={setEmails}
				placeholder="name@example.com"
				testID="tag-input-email"
				transform={(raw) => raw.toLowerCase()}
				validate={isEmail}
				value={emails}
			/>
			{hint ? (
				<Field.Error>{hint}</Field.Error>
			) : (
				<Field.Description>Separate with a comma or a space.</Field.Description>
			)}
		</Field>
	);
}
