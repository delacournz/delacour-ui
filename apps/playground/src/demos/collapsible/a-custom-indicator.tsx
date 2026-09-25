import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMinusSmall, IconPlusSmall, IconShieldCheck } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A custom indicator",
	caption:
		"A leading `Icon` stays where it was written and inherits the row's glyph step. The indicator takes a function of the open state, and `isAnimated={false}` stops a plus that becomes a minus from also spinning.",
};

export function Demo(): ReactElement {
	return (
		<Collapsible>
			<Collapsible.Trigger testID="custom-indicator">
				<Icon icon={IconShieldCheck} />
				<Collapsible.Title>Two-year warranty</Collapsible.Title>
				<Collapsible.Indicator isAnimated={false}>
					{({ isOpen }) => <Icon icon={isOpen ? IconMinusSmall : IconPlusSmall} />}
				</Collapsible.Indicator>
			</Collapsible.Trigger>
			<Collapsible.Content>
				<Text.Paragraph>
					Covers manufacturing faults for two years from delivery. Wear, water and the dog are not manufacturing faults.
				</Text.Paragraph>
			</Collapsible.Content>
		</Collapsible>
	);
}
