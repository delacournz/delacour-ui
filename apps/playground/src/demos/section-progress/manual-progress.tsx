import { SectionProgress } from "@delacour/react-native-ui/section-progress";
import { Slider } from "@delacour/react-native-ui/slider";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Manual progress",
	caption:
		"`progress` overrides the scroll — a number or a shared value, 0 to 1. Here a slider drives it: small steps track, and a jump of more than a tenth eases over 180ms.",
	capture: { align: "stretch", flow: true },
};

const STEPS = [
	{ value: "account", title: "Account" },
	{ value: "address", title: "Address" },
	{ value: "payment", title: "Payment" },
	{ value: "review", title: "Review" },
] as const;

export function Demo(): ReactElement {
	const [percent, setPercent] = useState(25);
	const step = STEPS[Math.min(STEPS.length - 1, Math.floor((percent / 100) * STEPS.length))] ?? STEPS[0];

	return (
		<View className="w-full gap-4">
			<Slider onChange={(next) => setPercent(next as number)} value={percent}>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb testID="section-progress-manual-thumb" />
				</Slider.Track>
			</Slider>
			<View className="h-[280px] w-full overflow-hidden rounded-xl border border-border bg-muted">
				<SectionProgress progress={percent / 100} revealAt={0} value={step.value}>
					{STEPS.map((item) => (
						<SectionProgress.Item key={item.value} value={item.value}>
							{item.title}
						</SectionProgress.Item>
					))}
				</SectionProgress>
			</View>
		</View>
	);
}
