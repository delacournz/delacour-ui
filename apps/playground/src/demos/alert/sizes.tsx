import { ALERT_SIZES, Alert, type AlertSize } from "@delacour/react-native-ui/alert";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "A size moves the padding, the gap, the type and the glyph together.",
	capture: { align: "stretch" },
};

const LABELS: Record<AlertSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ALERT_SIZES.map((size) => (
				<Alert isDismissible key={size} size={size} status="info" testID={`alert-size-${size}`}>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{LABELS[size]}</Alert.Title>
						<Alert.Description>Photos from your trip are ready to share.</Alert.Description>
					</Alert.Content>
				</Alert>
			))}
		</View>
	);
}
