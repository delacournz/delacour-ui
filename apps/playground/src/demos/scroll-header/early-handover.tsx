import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An early handover",
	caption:
		"`threshold={0.6}` hands the title to the bar after six-tenths of the Large block has scrolled, so a tall block with a paragraph under its title does not keep the bar empty for its whole height.",
	align: "stretch",
};

const PARAGRAPHS = [
	"Tuesday's release carries the new export flow, the reworked sharing sheet and forty smaller fixes.",
	"Exports now run in the background, so a long one no longer holds the screen.",
	"Sharing remembers the last three people you sent something to.",
	"The search index rebuilds itself after an import instead of waiting for a restart.",
	"Offline edits sync in the order they were made, not the order they reached the server.",
	"Dark mode follows the system by default; the old toggle is still in Settings.",
	"Large text now wraps in every list row instead of truncating.",
	"Thanks to everyone who sent a report from the beta.",
] as const;

export function Demo(): ReactElement {
	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader threshold={0.6}>
				<ScrollHeader.Bar>
					<ScrollHeader.BarTitle>Release notes</ScrollHeader.BarTitle>
				</ScrollHeader.Bar>
				<ScrollHeader.Large>
					<Text.Title>Release notes</Text.Title>
					<Text.Paragraph color="muted">
						Version 4.2 — what changed, what was fixed, and what to look out for after updating.
					</Text.Paragraph>
				</ScrollHeader.Large>
				<ScrollHeader.ScrollView contentContainerClassName="gap-4 px-screen-gutter pb-12" testID="scroll-header-early">
					{PARAGRAPHS.map((paragraph) => (
						<Text.Paragraph key={paragraph}>{paragraph}</Text.Paragraph>
					))}
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
