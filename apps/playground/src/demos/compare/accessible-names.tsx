import { Compare } from "@delacour/react-native-ui/compare";
import { Field } from "@delacour/react-native-ui/field";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Accessible names",
	caption:
		'The handle is an `adjustable` named by `accessibilityLabel`, or by an enclosing `Field.Label`. A string `Compare.Label` names its side in the value text — "50 percent Original" — and is itself hidden, so the name is heard once.',
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Retouch</Field.Label>
			<Compare className="aspect-video">
				<Compare.Before>
					<View className="flex-1 bg-muted" />
				</Compare.Before>
				<Compare.After>
					<View className="flex-1 bg-info" />
				</Compare.After>
				<Compare.Label side="before">Original</Compare.Label>
				<Compare.Label side="after">Retouched</Compare.Label>
				<Compare.Handle testID="compare-named-handle" />
			</Compare>
		</Field>
	);
}
