import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { Tour, useTour } from "@delacour/react-native-ui/tour";
import { type ReactElement, useRef } from "react";
import { type LayoutChangeEvent, ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scroll into view",
	caption:
		"`onStepChange` fires before the step is measured, so it is where a target off screen is scrolled into view. Scroll without animation — the tour measures a frame later.",
	align: "stretch",
};

const ROWS = ["Profile", "Notifications", "Privacy", "Storage", "Billing", "About"] as const;
const STEPS: Readonly<Record<number, (typeof ROWS)[number]>> = { 1: "Profile", 2: "Storage", 3: "About" };

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-scroll-start" variant="outline">
			Start tour
		</Button>
	);
}

export function Demo(): ReactElement {
	const scrollRef = useRef<ScrollView>(null);
	const offsets = useRef<Partial<Record<(typeof ROWS)[number], number>>>({});

	const handleStepChange = (order: number): void => {
		const row = STEPS[order];
		const y = row ? offsets.current[row] : undefined;
		if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: false });
	};

	const handleRowLayout = (row: (typeof ROWS)[number]) => (event: LayoutChangeEvent) => {
		offsets.current[row] = event.nativeEvent.layout.y;
	};

	return (
		<Tour className="flex-none gap-4" onStepChange={handleStepChange}>
			<ScrollView className="h-44 rounded-lg border border-border" nestedScrollEnabled ref={scrollRef}>
				{ROWS.map((row) => {
					const order = Object.entries(STEPS).find(([, name]) => name === row)?.[0];
					const content = <Text.Paragraph>{row}</Text.Paragraph>;
					return (
						<View className="h-16 justify-center px-4" key={row} onLayout={handleRowLayout(row)}>
							{order ? (
								<Tour.Step description={`Everything about ${row.toLowerCase()}.`} order={Number(order)} title={row}>
									{content}
								</Tour.Step>
							) : (
								content
							)}
						</View>
					);
				})}
			</ScrollView>
			<StartButton />
		</Tour>
	);
}
