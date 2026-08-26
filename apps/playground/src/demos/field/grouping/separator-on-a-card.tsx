import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Separator on a card",
	caption:
		"The label is drawn between two rules rather than on top of one, so it needs no background of its own. On a card, an implementation that punched a hole with an opaque label would show a block of the page colour here.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="rounded-2xl border border-border bg-card p-4">
			<Field.Group>
				<Field>
					<Field.Label>Card number</Field.Label>
					<Input inputMode="numeric" placeholder="4242 4242 4242 4242" />
				</Field>
				<Field.Separator>Or pay another way</Field.Separator>
				<Field>
					<Field.Label>Voucher code</Field.Label>
					<Input autoCapitalize="characters" placeholder="GIFT-2026" />
				</Field>
			</Field.Group>
		</View>
	);
}
