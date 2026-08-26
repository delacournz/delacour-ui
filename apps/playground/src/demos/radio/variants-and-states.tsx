import { RADIO_VARIANTS, Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants and states",
	note: "The ring is drawn from Views, not an icon — so the dot springs in on the UI thread and every colour stays a class the variant tests can reach.",
	capture: { hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{RADIO_VARIANTS.map((variant) => (
				<View className="gap-2" key={variant}>
					<Text.Caption color="muted">{variant}</Text.Caption>
					<Radio.Group
						accessibilityLabel={`${variant} example`}
						defaultSelected="on"
						orientation="horizontal"
						variant={variant}
					>
						<Radio testID={`radio-${variant}-on`} value="on">
							Selected
						</Radio>
						<Radio testID={`radio-${variant}-off`} value="off">
							Not selected
						</Radio>
					</Radio.Group>
				</View>
			))}
		</View>
	);
}
