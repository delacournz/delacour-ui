import {
	PAGE_HEADER_STATS_LAYOUTS,
	PageHeader,
	type PageHeaderStatsLayout,
} from "@delacour/react-native-ui/page-header";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stats",
	caption:
		"`stacked` puts each value over its label in equal-width cells, so the middle stat stays under the title however wide the labels are. `inline` runs them together and wraps. `isDivided` adds hairlines, hidden from screen readers.",
	capture: { align: "stretch" },
};

const LABELS: Record<PageHeaderStatsLayout, string> = {
	stacked: "Stacked",
	inline: "Inline",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{PAGE_HEADER_STATS_LAYOUTS.map((layout) => (
				<PageHeader key={layout} testID={`page-header-stats-${layout}`}>
					<PageHeader.Content>
						<PageHeader.Title>{LABELS[layout]}</PageHeader.Title>
					</PageHeader.Content>
					<PageHeader.Stats isDivided layout={layout}>
						<PageHeader.Stat label="Followers" testID={`page-header-stats-${layout}-followers`} value={12_500} />
						<PageHeader.Stat label="Posts" testID={`page-header-stats-${layout}-posts`} value={87} />
						<PageHeader.Stat label="Rank" testID={`page-header-stats-${layout}-rank`} value="Top 5" />
					</PageHeader.Stats>
				</PageHeader>
			))}
		</View>
	);
}
