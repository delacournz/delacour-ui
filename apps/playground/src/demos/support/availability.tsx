import { Button } from "@delacour/react-native-ui/button";
import { SUPPORT_AVAILABILITIES, Support, type SupportAvailability } from "@delacour/react-native-ui/support";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Availability",
	caption:
		"Set once on the root and read by every status. The first line is the caller's wording; the second falls back to the availability's own. Tap to cycle.",
	align: "stretch",
	capture: { align: "stretch", flow: true },
};

const REPLY_TIME: Record<SupportAvailability, string> = {
	online: "Typically replies in under an hour",
	away: "Back at 9am tomorrow",
	offline: "We'll reply by email",
};

const LABELS: Record<SupportAvailability, string> = {
	online: "Online",
	away: "Away",
	offline: "Offline",
};

export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);
	const availability = SUPPORT_AVAILABILITIES[index % SUPPORT_AVAILABILITIES.length] ?? "offline";

	return (
		<View className="gap-4">
			<Support availability={availability} className="gap-3">
				<Support.Status replyTime={REPLY_TIME[availability]} />
				<Support.Status />
			</Support>
			<Button onPress={() => setIndex((current) => current + 1)} size="sm" testID="support-cycle" variant="secondary">
				{`Now ${LABELS[availability]} — tap to change`}
			</Button>
		</View>
	);
}
