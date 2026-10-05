import { Button } from "@delacour/react-native-ui/button";
import { SectionProgress } from "@delacour/react-native-ui/section-progress";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled open",
	caption:
		"`isOpen` and `onOpenChange` hand the panel to the caller — a button elsewhere on the screen opens it, and the pill, an outside tap, the escape gesture and Android back still close it through the same callback.",
};

const CHAPTERS = [
	{ value: "one", title: "The harbour" },
	{ value: "two", title: "Low tide" },
	{ value: "three", title: "The crossing" },
	{ value: "four", title: "Landfall" },
	{ value: "five", title: "Inland" },
	{ value: "six", title: "The ridge" },
	{ value: "seven", title: "Weather" },
	{ value: "eight", title: "Home" },
] as const;

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [chapter, setChapter] = useState<string>("three");

	return (
		<View className="w-full gap-3">
			<View className="flex-row items-center justify-between">
				<Text.Caption color="muted" testID="section-progress-controlled-state">
					{isOpen ? "Panel open" : "Panel closed"}
				</Text.Caption>
				<Button
					onPress={() => setOpen(!isOpen)}
					size="sm"
					testID="section-progress-controlled-toggle"
					variant="outline"
				>
					{isOpen ? "Close chapters" : "Open chapters"}
				</Button>
			</View>
			<View className="h-[480px] w-full overflow-hidden rounded-xl border border-border bg-muted">
				<SectionProgress
					isOpen={isOpen}
					onOpenChange={setOpen}
					onValueChange={setChapter}
					progress={0.35}
					revealAt={0}
					value={chapter}
				>
					{CHAPTERS.map((item) => (
						<SectionProgress.Item key={item.value} value={item.value}>
							{item.title}
						</SectionProgress.Item>
					))}
				</SectionProgress>
			</View>
		</View>
	);
}
