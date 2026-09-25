import { ALERT_TINTED_STATUSES, Alert, type AlertStatus } from "@delacour/react-native-ui/alert";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Surface variant",
	caption:
		'`variant="surface"` keeps a neutral fill and lets the glyph and title carry the colour. Inside a card, each alert steps off the card\'s fill rather than vanishing into it.',
	capture: { align: "stretch" },
};

const TITLES: Record<AlertStatus, string> = {
	default: "Note",
	info: "Sync is paused while you are offline",
	success: "Backup finished",
	warning: "Storage almost full",
	destructive: "Two files failed to upload",
};

export function Demo(): ReactElement {
	return (
		<Surface className="gap-3">
			<Text.Label>Activity</Text.Label>
			{ALERT_TINTED_STATUSES.map((status) => (
				<Alert key={status} size="sm" status={status} testID={`alert-surface-${status}`} variant="surface">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{TITLES[status]}</Alert.Title>
					</Alert.Content>
				</Alert>
			))}
		</Surface>
	);
}
