import { Accordion } from "@delacour/native-ui/accordion";
import { Icon } from "@delacour/native-ui/icon";
import { IconTruck } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A glyph beside the title",
	caption:
		"A trigger assembles its own row: titles and descriptions stack in a column, anything else stays where it was written, and the indicator is moved to the end. An `Icon` needs nothing said at the call site — it inherits the accordion's glyph step and foreground.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Accordion>
			<Accordion.Item value="one">
				<Accordion.Trigger testID="delivery">
					<Icon icon={IconTruck} />
					<Accordion.Title>Delivery</Accordion.Title>
					<Accordion.Description>Written before the title, and it stays there</Accordion.Description>
				</Accordion.Trigger>
				<Accordion.Content>
					<Text.Paragraph>
						Tracked from the moment it leaves us, and signed for on anything over $200. Rural addresses add a day.
					</Text.Paragraph>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion>
	);
}
