import { Button } from "@delacour/react-native-ui/button";
import { SectionRail } from "@delacour/react-native-ui/section-rail";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled open state",
	caption:
		"`isOpen` and `onOpenChange` hand the panel to the caller — here a button opens it, and the rail still closes it after a pick, on an outside tap or on Android's back.",
	capture: { align: "stretch", flow: true },
};

const SECTIONS = [
	{ id: "summary", title: "Summary" },
	{ id: "timeline", title: "Timeline" },
	{ id: "budget", title: "Budget" },
	{ id: "risks", title: "Risks" },
] as const;

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [section, setSection] = useState<string>(SECTIONS[0].id);
	const title = SECTIONS.find((entry) => entry.id === section)?.title ?? "";

	return (
		<View className="h-100 overflow-hidden rounded-xl border border-border">
			<View className="flex-1 justify-center gap-4 p-6 pe-14">
				<Text.Overline>Reading</Text.Overline>
				<Text.Title>{title}</Text.Title>
				<View className="items-start">
					<Button onPress={() => setOpen(true)} testID="section-rail-controlled-open" variant="secondary">
						Show outline
					</Button>
				</View>
			</View>

			<SectionRail isOpen={isOpen} onOpenChange={setOpen} onValueChange={setSection} value={section}>
				<SectionRail.Trigger testID="section-rail-controlled-trigger">
					{SECTIONS.map((entry) => (
						<SectionRail.Bar key={entry.id} value={entry.id} />
					))}
				</SectionRail.Trigger>
				<SectionRail.Content>
					{SECTIONS.map((entry) => (
						<SectionRail.Item key={entry.id} testID={`section-rail-controlled-${entry.id}`} value={entry.id}>
							{entry.title}
						</SectionRail.Item>
					))}
				</SectionRail.Content>
			</SectionRail>
		</View>
	);
}
