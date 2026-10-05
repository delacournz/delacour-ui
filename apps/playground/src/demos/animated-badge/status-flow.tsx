import { AnimatedBadge, type AnimatedBadgeStatus } from "@delacour/react-native-ui/animated-badge";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Status flow",
	align: "center",
	caption: "Each step rolls the old status out and the new one in, and the capsule springs to the new width.",
};

const STEPS: readonly { status: AnimatedBadgeStatus; label: string }[] = [
	{ status: "neutral", label: "Queued" },
	{ status: "loading", label: "Building" },
	{ status: "info", label: "Deploying" },
	{ status: "success", label: "Live" },
];

export function Demo(): ReactElement {
	const [step, setStep] = useState(0);
	const current = STEPS[step] ?? STEPS[0];

	return (
		<View className="items-center gap-6">
			<AnimatedBadge status={current.status} testID="deploy-status">
				{current.label}
			</AnimatedBadge>
			<Button
				onPress={() => setStep((index) => (index + 1) % STEPS.length)}
				size="sm"
				testID="next-step"
				variant="secondary"
			>
				Next step
			</Button>
		</View>
	);
}
