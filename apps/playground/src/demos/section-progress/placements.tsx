import { Button } from "@delacour/react-native-ui/button";
import {
	SECTION_PROGRESS_PLACEMENTS,
	SectionProgress,
	type SectionProgressPlacement,
} from "@delacour/react-native-ui/section-progress";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placements",
	caption:
		"Six placements, `offset` points in from the safe area. A `top-*` pill opens its panel downward, a `bottom-*` one upward, and `start` and `end` mirror under right-to-left.",
	capture: { align: "stretch", flow: true },
};

const LABELS: Record<SectionProgressPlacement, string> = {
	"bottom-center": "Bottom centre",
	"top-center": "Top centre",
	"bottom-start": "Bottom start",
	"bottom-end": "Bottom end",
	"top-start": "Top start",
	"top-end": "Top end",
};

export function Demo(): ReactElement {
	const [placement, setPlacement] = useState<SectionProgressPlacement>("bottom-center");

	return (
		<View className="w-full gap-3">
			<View className="flex-row flex-wrap gap-2">
				{SECTION_PROGRESS_PLACEMENTS.map((option) => (
					<Button
						key={option}
						onPress={() => setPlacement(option)}
						size="sm"
						testID={`section-progress-placement-${option}`}
						variant={option === placement ? "primary" : "outline"}
					>
						{LABELS[option]}
					</Button>
				))}
			</View>
			<View className="h-[360px] w-full overflow-hidden rounded-xl border border-border bg-muted">
				<SectionProgress
					defaultValue="pricing"
					offset={12}
					placement={placement}
					progress={0.42}
					revealAt={0}
					testID="section-progress-placement"
				>
					<SectionProgress.Item value="introduction">Introduction</SectionProgress.Item>
					<SectionProgress.Item value="pricing">Pricing</SectionProgress.Item>
					<SectionProgress.Item value="faq">Questions</SectionProgress.Item>
				</SectionProgress>
			</View>
		</View>
	);
}
