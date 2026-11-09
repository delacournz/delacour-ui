import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { toast, useToastOffset } from "@delacour/react-native-ui/toast";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A measured bar",
	caption:
		"A tab bar keeps its height in a shared value and writes it with `.set()` in `onLayout`, so the toasts follow with no re-render. Passing `null` while its screen is out of focus slides them down, and back up on return.",
	align: "center",
};

/** The two heights the pretend tab bar switches between, in points. */
const BAR_HEIGHTS = { compact: 72, tall: 136 } as const;

export function Demo(): ReactElement {
	const height = useSharedValue(0);
	const [isFocused, setFocused] = useState(true);
	const [isTall, setTall] = useState(false);
	useToastOffset(isFocused ? { bottom: height } : null);
	return (
		<View className="flex-1">
			<View className="flex-1 items-center justify-center gap-3">
				<Button
					onPress={() => toast.show({ title: "Saved", description: "It sits above the bar.", duration: 0 })}
					testID="toast-bar-show"
					variant="outline"
				>
					Show a toast
				</Button>
				<Button onPress={() => setTall((wasTall) => !wasTall)} testID="toast-bar-resize" variant="ghost">
					{isTall ? "Shrink the bar" : "Grow the bar"}
				</Button>
				<Button onPress={() => setFocused((wasFocused) => !wasFocused)} testID="toast-bar-focus" variant="ghost">
					{isFocused ? "Leave the screen" : "Come back"}
				</Button>
				<Button onPress={() => toast.hideAll()} testID="toast-bar-hide-all" variant="ghost">
					Hide all
				</Button>
			</View>
			<View
				className="items-center justify-center border-border border-t bg-card"
				onLayout={(event) => height.set(event.nativeEvent.layout.height)}
				style={{ height: isTall ? BAR_HEIGHTS.tall : BAR_HEIGHTS.compact }}
			>
				<Text.Caption className="text-muted-foreground">
					{isFocused ? "Tab bar" : "Tab bar — screen out of focus"}
				</Text.Caption>
			</View>
		</View>
	);
}
