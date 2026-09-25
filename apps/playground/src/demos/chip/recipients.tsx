import { Chip } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconAt } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Recipients",
	caption:
		"Tokens entered as text. Submitting the field turns an address into a chip; an address that does not look like one is added in `destructive` so it can be spotted and removed.",
	keyboardAware: true,
};

/** Loose on purpose: a demo of the chip, not of address validation. */
function looksLikeAddress(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function Demo(): ReactElement {
	const [recipients, setRecipients] = useState<readonly string[]>(["aroha@delacour.co.nz", "james@"]);
	const [draft, setDraft] = useState("");

	const add = () => {
		const value = draft.trim();
		if (value.length > 0 && !recipients.includes(value)) setRecipients((current) => [...current, value]);
		setDraft("");
	};

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{recipients.map((address, index) => (
					<Chip
						closeAccessibilityLabel={`Remove ${address}`}
						color={looksLikeAddress(address) ? "default" : "destructive"}
						key={address}
						onClose={() => setRecipients((current) => current.filter((item) => item !== address))}
						size="sm"
						testID={`recipient-${index}`}
					>
						<Icon icon={IconAt} />
						<Chip.Label>{address}</Chip.Label>
					</Chip>
				))}
				{recipients.length === 0 ? <Text.Caption color="muted">No recipients.</Text.Caption> : null}
			</View>
			<Input
				autoCapitalize="none"
				autoCorrect={false}
				keyboardType="email-address"
				onChangeText={setDraft}
				onSubmitEditing={add}
				placeholder="Add an address"
				returnKeyType="done"
				submitBehavior="submit"
				testID="recipient-input"
				value={draft}
			/>
		</View>
	);
}
