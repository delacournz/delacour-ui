import { Button } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group",
	caption:
		"`Button.Group` joins several buttons into one run. Members square the corners crossing each seam and overlap by a point, so two borders draw as one hairline.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<Button.Group testID="group-outline" variant="outline">
				<Button testID="group-archive">Archive</Button>
				<Button testID="group-report">Report</Button>
				<Button testID="group-snooze">Snooze</Button>
			</Button.Group>
			<Button.Group testID="group-secondary" variant="secondary">
				<Button testID="group-day">Day</Button>
				<Button testID="group-week">Week</Button>
				<Button testID="group-month">Month</Button>
			</Button.Group>
			<Button.Group size="sm" testID="group-single" variant="outline">
				<Button testID="group-alone">On its own</Button>
			</Button.Group>
		</View>
	);
}
