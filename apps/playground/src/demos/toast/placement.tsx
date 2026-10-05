import { Button } from "@delacour/react-native-ui/button";
import { TOAST_PLACEMENTS, type ToastPlacement, toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placement",
	caption:
		"`placement` picks the edge. Top toasts sit under the status bar; bottom ones above the home indicator, and above the keyboard when it is open.",
	align: "center",
	capture: { flow: "toast/placement", frame: "device" },
};

const LABELS: Record<ToastPlacement, string> = {
	top: "Top",
	bottom: "Bottom",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 flex-row items-center justify-center gap-3">
			{TOAST_PLACEMENTS.map((placement) => (
				<Button
					key={placement}
					onPress={() =>
						toast.info(`From the ${placement}`, { placement, description: "Swipe it back the way it came." })
					}
					testID={`toast-placement-${placement}`}
					variant="outline"
				>
					{LABELS[placement]}
				</Button>
			))}
		</View>
	);
}
