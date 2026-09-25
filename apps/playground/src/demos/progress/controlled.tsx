import { Button } from "@delacour/react-native-ui/button";
import { Progress } from "@delacour/react-native-ui/progress";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Animated value",
	note: "The bar holds no state of its own — the value is always the caller's. Each change starts one timing on the UI thread, so a jump reads as travel rather than as a cut, and the frames in between never touch React.",
};

const STEP = 10;

function clamp(value: number): number {
	return Math.min(100, Math.max(0, value));
}

export function Demo(): ReactElement {
	const [value, setValue] = useState(30);

	return (
		<View className="gap-5">
			<Progress color="primary" testID="progress-controlled" value={value}>
				<Progress.Header>
					<Progress.Label>Profile complete</Progress.Label>
					<Progress.Output testID="progress-controlled-output" />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
			<View className="flex-row gap-2">
				<Button
					className="flex-1"
					onPress={() => setValue((current) => clamp(current - STEP))}
					size="sm"
					testID="progress-decrement"
					variant="secondary"
				>
					<Button.Label>−10</Button.Label>
				</Button>
				<Button
					className="flex-1"
					onPress={() => setValue((current) => clamp(current + STEP))}
					size="sm"
					testID="progress-increment"
					variant="secondary"
				>
					<Button.Label>+10</Button.Label>
				</Button>
				<Button className="flex-1" onPress={() => setValue(100)} size="sm" testID="progress-complete" variant="outline">
					<Button.Label>Done</Button.Label>
				</Button>
				<Button className="flex-1" onPress={() => setValue(0)} size="sm" testID="progress-reset" variant="ghost">
					<Button.Label>Reset</Button.Label>
				</Button>
			</View>
		</View>
	);
}
