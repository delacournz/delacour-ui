import { ALERT_STATUSES, Alert, type AlertStatus } from "@delacour/react-native-ui/alert";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Statuses",
	caption:
		"Five statuses on the default `soft` variant. The status picks the glyph and colours it and the title from one token; the description stays muted.",
	capture: { align: "stretch", hero: true },
};

const COPY: Record<AlertStatus, { title: string; description: string }> = {
	default: { title: "Heads up", description: "Your workspace moves to the new editor on Monday." },
	info: { title: "Update available", description: "Version 2.4 is ready to install." },
	success: { title: "Changes saved", description: "Everyone on the team can see them now." },
	warning: { title: "Card expiring", description: "The card ending 4242 expires next month." },
	destructive: { title: "Payment failed", description: "Your bank declined the charge." },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ALERT_STATUSES.map((status) => (
				<Alert key={status} status={status} testID={`alert-status-${status}`}>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{COPY[status].title}</Alert.Title>
						<Alert.Description>{COPY[status].description}</Alert.Description>
					</Alert.Content>
				</Alert>
			))}
		</View>
	);
}
