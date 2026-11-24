import { Button } from "@delacour/react-native-ui/button";
import { toast, useToastOffset } from "@delacour/react-native-ui/toast";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Clear of app chrome",
	caption:
		"`useToastOffset({ bottom: height })` lifts the bottom stack clear of a tab bar or toolbar, measured from the screen edge, and slides it as the chrome changes.",
	align: "center",
};

/** Points of the screen's bottom edge the pretend toolbar covers while it is shown. */
const TOOLBAR_HEIGHT = 160;

export function Demo(): ReactElement {
	const [isToolbarShown, setToolbarShown] = useState(true);
	useToastOffset({ bottom: isToolbarShown ? TOOLBAR_HEIGHT : 0 });
	return (
		<View className="flex-1 items-center justify-center gap-3">
			<Button
				onPress={() => toast.show({ title: "Saved", description: "It sits above the toolbar.", duration: 0 })}
				testID="toast-chrome-show"
				variant="outline"
			>
				Show a toast
			</Button>
			<Button onPress={() => setToolbarShown((isShown) => !isShown)} testID="toast-chrome-toggle" variant="ghost">
				{isToolbarShown ? "Hide toolbar" : "Show toolbar"}
			</Button>
			<Button onPress={() => toast.hideAll()} testID="toast-chrome-hide-all" variant="ghost">
				Hide all
			</Button>
		</View>
	);
}
