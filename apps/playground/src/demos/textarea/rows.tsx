import { Field } from "@delacour/react-native-ui/field";
import { Textarea } from "@delacour/react-native-ui/textarea";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Rows",
	caption:
		"`rows` is how many lines tall the field is before it scrolls. Type past the last line and the text scrolls inside the box; the box stays put.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const ROWS = [2, 4, 6] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{ROWS.map((rows) => (
				<Field key={rows}>
					<Field.Label>{`${rows} rows`}</Field.Label>
					<Textarea placeholder={`Room for ${rows} lines`} rows={rows} testID={`rows-${rows}`} />
				</Field>
			))}
		</View>
	);
}
