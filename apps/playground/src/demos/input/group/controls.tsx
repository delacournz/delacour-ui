import { Button } from "@delacour/native-ui/button";
import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import {
	IconCrossSmall,
	IconEyeOpen,
	IconEyeSlash,
	IconMagnifyingGlass,
	IconShieldCheck,
} from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controls",
	caption:
		"A `Button` in a decorator keeps its own press. Tapping the gutter beside it focuses the field instead — a grouped box behaves the way a lone field's does, edge to edge.",
	keyboardAware: true,
};

/** A search field whose clear button appears only once there is something to clear. */
function SearchField(): ReactElement {
	const [value, setValue] = useState("");

	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconMagnifyingGlass} />
			</Input.Group.Prefix>
			<Input onChangeText={setValue} placeholder="Search" testID="search" value={value} />
			{value.length > 0 ? (
				<Input.Group.Suffix>
					<Button
						accessibilityLabel="Clear"
						isIconOnly
						onPress={() => setValue("")}
						size="sm"
						testID="clear"
						variant="ghost"
					>
						<Icon icon={IconCrossSmall} />
					</Button>
				</Input.Group.Suffix>
			) : null}
		</Input.Group>
	);
}

/** A password field whose suffix toggles the value between hidden and shown. */
function PasswordField(): ReactElement {
	const [isRevealed, setRevealed] = useState(false);

	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconShieldCheck} />
			</Input.Group.Prefix>
			<Input autoCapitalize="none" defaultValue="hunter2" secureTextEntry={!isRevealed} testID="password" />
			<Input.Group.Suffix>
				<Button
					accessibilityLabel={isRevealed ? "Hide password" : "Show password"}
					isIconOnly
					onPress={() => setRevealed((current) => !current)}
					size="sm"
					testID="reveal"
					variant="ghost"
				>
					<Icon icon={isRevealed ? IconEyeSlash : IconEyeOpen} />
				</Button>
			</Input.Group.Suffix>
		</Input.Group>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Clear</Field.Label>
				<SearchField />
			</Field>
			<Field>
				<Field.Label>Reveal</Field.Label>
				<PasswordField />
			</Field>
		</View>
	);
}
