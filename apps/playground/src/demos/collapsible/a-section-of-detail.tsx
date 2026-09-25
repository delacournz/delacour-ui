import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A section of detail",
	caption:
		"A row, a chevron, and a panel that opens under it — starting open here with `defaultOpen`. It holds its own state, so nothing needs wiring — the panel's height is measured, then sprung from zero to whatever its content came out at.",
	capture: { align: "stretch", flow: "collapsible/a-section-of-detail", hero: true },
};

export function Demo(): ReactElement {
	return (
		<Collapsible defaultOpen>
			<Collapsible.Trigger testID="included">
				<Collapsible.Title>What is included</Collapsible.Title>
				<Collapsible.Description>Pro plan, billed yearly</Collapsible.Description>
			</Collapsible.Trigger>
			<Collapsible.Content>
				<Text.Paragraph>
					Unlimited projects, 100 GB of storage, priority email support and every integration we ship this year.
				</Text.Paragraph>
			</Collapsible.Content>
		</Collapsible>
	);
}
