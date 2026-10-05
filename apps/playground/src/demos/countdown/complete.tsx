import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Countdown } from "@delacour/react-native-ui/countdown";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Completion",
	caption:
		"The final second reads `0:01`. At `0:00` `onComplete` fires once, and the screen swaps the countdown for what comes next.",
	align: "center",
};

const TEN_SECONDS = 10 * 1000;

export function Demo(): ReactElement {
	const [endsAt, setEndsAt] = useState(() => Date.now() + TEN_SECONDS);
	const [isExpired, setIsExpired] = useState(false);

	const restart = (): void => {
		setIsExpired(false);
		setEndsAt(Date.now() + TEN_SECONDS);
	};

	return (
		<View className="items-center gap-4">
			{isExpired ? (
				<Badge color="destructive" testID="countdown-expired" variant="soft">
					<Badge.Label>Expired</Badge.Label>
				</Badge>
			) : (
				<Countdown onComplete={() => setIsExpired(true)} to={endsAt} urgentBelow={5} />
			)}
			<Button onPress={restart} size="sm" testID="countdown-restart" variant="secondary">
				<Button.Label>Restart</Button.Label>
			</Button>
		</View>
	);
}
