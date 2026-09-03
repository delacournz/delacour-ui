import { Checkbox } from "delacour-react-native-ui/checkbox";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Indeterminate",
	caption:
		"The parent draws a dash while its children are partly selected, and reports `mixed` to a screen reader rather than a half-truth.",
	capture: {},
};

const PERMISSIONS = ["Read", "Write", "Delete"] as const;

export function Demo(): ReactElement {
	const [permissions, setPermissions] = useState<string[]>([]);

	const allPermissions = permissions.length === PERMISSIONS.length;
	const somePermissions = permissions.length > 0 && !allPermissions;

	const toggleAll = () => setPermissions(allPermissions ? [] : [...PERMISSIONS]);

	return (
		<View className="gap-3">
			<Checkbox
				color="primary"
				isChecked={allPermissions}
				isIndeterminate={somePermissions}
				onCheckedChange={toggleAll}
				testID="checkbox-all"
			>
				<Checkbox.Label>Select all</Checkbox.Label>
			</Checkbox>
			<View className="pl-7">
				<Checkbox.Group checked={permissions} color="primary" onChecked={setPermissions}>
					{PERMISSIONS.map((permission) => (
						<Checkbox key={permission} testID={`checkbox-${permission}`} value={permission}>
							{permission}
						</Checkbox>
					))}
				</Checkbox.Group>
			</View>
			<Text.Caption>{`${permissions.length} permissions`}</Text.Caption>
		</View>
	);
}
