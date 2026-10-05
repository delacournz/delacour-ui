import { Icon } from "@delacour/react-native-ui/icon";
import { IconBubbleText, IconPhone } from "@delacour/react-native-ui/icons/central";
import { Support } from "@delacour/react-native-ui/support";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A shut channel",
	caption:
		"Out of hours, the phone line stays on screen — dimmed, announced disabled and ignoring taps — rather than vanishing and leaving the reader to wonder where it went.",
};

export function Demo(): ReactElement {
	return (
		<Support availability="away">
			<Support.Status replyTime="Back at 9am tomorrow" />
			<Support.Channels title="Get in touch">
				<Support.Channel
					detail="~1d"
					icon={<Icon icon={IconBubbleText} />}
					label="Leave a message"
					onPress={() => {}}
				/>
				<Support.Channel
					description="Weekdays, 9am to 5pm"
					icon={<Icon icon={IconPhone} />}
					isDisabled
					label="Call us"
					onPress={() => {}}
				/>
			</Support.Channels>
		</Support>
	);
}
