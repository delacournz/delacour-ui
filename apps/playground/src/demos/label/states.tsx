import { Input } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

type LabelState = "default" | "required" | "invalid" | "required-invalid" | "disabled";

const STATES: readonly LabelState[] = ["default", "required", "invalid", "required-invalid", "disabled"];

const LABELS: Record<LabelState, string> = {
	default: "Username",
	required: "Email",
	invalid: "Phone",
	"required-invalid": "Password",
	disabled: "Account ID",
};

const VALUES: Record<LabelState, string> = {
	default: "ada",
	required: "ada@example.com",
	invalid: "12",
	"required-invalid": "",
	disabled: "acct_8813",
};

export const meta: DemoMeta = {
	title: "States",
	caption:
		"Required appends a destructive asterisk, invalid turns the whole label destructive, and disabled fades it. They are independent, so a required field that is also wrong shows both.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{STATES.map((state) => {
				const isInvalid = state === "invalid" || state === "required-invalid";
				const isDisabled = state === "disabled";

				return (
					<View className="gap-1.5" key={state}>
						<Label
							isDisabled={isDisabled}
							isInvalid={isInvalid}
							isRequired={state === "required" || state === "required-invalid"}
							testID={`label-${state}`}
						>
							{LABELS[state]}
						</Label>
						<Input defaultValue={VALUES[state]} isDisabled={isDisabled} isInvalid={isInvalid} />
					</View>
				);
			})}
		</View>
	);
}
