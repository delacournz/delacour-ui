import { Button } from "@delacour/react-native-ui/button";
import { TOAST_STATUSES, type ToastStatus, toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Statuses",
	caption:
		"`toast()` from a button — Alert's five statuses, glyphs and title colours. Success, warning and destructive play their haptic.",
	align: "center",
	capture: { flow: "toast/statuses", frame: "device", hero: true },
};

const LABELS: Record<ToastStatus, string> = {
	default: "Default",
	info: "Info",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
};

const MESSAGES: Record<ToastStatus, { title: string; description: string }> = {
	default: { title: "Link copied", description: "Paste it anywhere to share the project." },
	info: { title: "Sync paused", description: "Changes save on this phone until you reconnect." },
	success: { title: "Changes saved", description: "Everyone on the project sees them now." },
	warning: { title: "Storage almost full", description: "1.8 GB of 2 GB used." },
	destructive: { title: "Upload failed", description: "The connection dropped. Nothing was sent." },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center gap-3">
			{TOAST_STATUSES.map((status) => (
				<Button
					key={status}
					onPress={() => toast.show({ status, ...MESSAGES[status] })}
					size="sm"
					testID={`toast-status-${status}`}
					variant="outline"
				>
					{LABELS[status]}
				</Button>
			))}
		</View>
	);
}
