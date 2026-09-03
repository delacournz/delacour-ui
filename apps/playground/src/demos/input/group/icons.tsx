import { Field } from "delacour-react-native-ui/field";
import { Icon } from "delacour-react-native-ui/icon";
import { IconAt, IconCurrencyDollar, IconShieldCheck } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icons",
	caption:
		"A bare `Icon` needs nothing at the call site — it inherits the field's icon step and a muted colour from the decorator.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Prefix</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>
						<Icon icon={IconAt} />
					</Input.Group.Prefix>
					<Input autoCapitalize="none" inputMode="email" placeholder="Email" />
				</Input.Group>
			</Field>
			<Field>
				<Field.Label>Suffix</Field.Label>
				<Input.Group>
					<Input placeholder="Amount" inputMode="decimal" />
					<Input.Group.Suffix>
						<Icon icon={IconCurrencyDollar} />
					</Input.Group.Suffix>
				</Input.Group>
			</Field>
			<Field>
				<Field.Label>Both</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>
						<Icon icon={IconCurrencyDollar} />
					</Input.Group.Prefix>
					<Input inputMode="decimal" placeholder="0.00" />
					<Input.Group.Suffix>
						<Icon icon={IconShieldCheck} />
					</Input.Group.Suffix>
				</Input.Group>
			</Field>
		</View>
	);
}
