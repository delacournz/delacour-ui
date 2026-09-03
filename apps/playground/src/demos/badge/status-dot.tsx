import { Badge } from "delacour-react-native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Status dot",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			<Badge color="success" variant="soft">
				<Badge.StartContent>
					<View className="size-1.5 rounded-full bg-success" />
				</Badge.StartContent>
				<Badge.Label>Online</Badge.Label>
			</Badge>
			<Badge color="warning" variant="soft">
				<Badge.StartContent>
					<View className="size-1.5 rounded-full bg-warning" />
				</Badge.StartContent>
				<Badge.Label>Away</Badge.Label>
			</Badge>
			<Badge variant="soft">
				<Badge.StartContent>
					<View className="size-1.5 rounded-full bg-muted-foreground" />
				</Badge.StartContent>
				<Badge.Label>Offline</Badge.Label>
			</Badge>
		</View>
	);
}
