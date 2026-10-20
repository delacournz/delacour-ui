import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCreditCard1, IconPackage, IconUser } from "@delacour/react-native-ui/icons/central";
import { Support } from "@delacour/react-native-ui/support";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Topics",
	caption:
		"One request goes to one queue, so the topics are a radio group: one is ever selected, and pressing it again keeps it. Continue waits until one is picked, and sending the request clears the form.",
	align: "stretch",
	capture: { align: "stretch", flow: true, hero: true },
};

export function Demo(): ReactElement {
	const [topic, setTopic] = useState<string | null>(null);

	return (
		<Support>
			<Support.Topics
				description="So we can send you to the right person."
				onValueChange={setTopic}
				title="What's it about?"
				value={topic}
			>
				<Support.Topic
					description="Invoices, refunds and plans"
					icon={<Icon icon={IconCreditCard1} />}
					label="Billing"
					testID="support-topic-billing"
					value="billing"
				/>
				<Support.Topic
					description="Tracking, returns and damage"
					icon={<Icon icon={IconPackage} />}
					label="An order"
					testID="support-topic-order"
					value="order"
				/>
				<Support.Topic
					description="Sign-in, email and privacy"
					icon={<Icon icon={IconUser} />}
					label="My account"
					value="account"
				/>
			</Support.Topics>
			<Button isDisabled={topic === null} onPress={() => setTopic(null)} testID="support-continue">
				Continue
			</Button>
		</Support>
	);
}
