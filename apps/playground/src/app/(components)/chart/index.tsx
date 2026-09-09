import {
	IconAnalytics,
	IconBubbleDots,
	IconChart1,
	IconLayersTwo,
	IconPieChart1,
	IconPuzzle,
	IconTradingViewCandles,
	IconTrending1,
} from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { FolderIndex, type FolderIndexItem } from "@/components/folder-index";

const DEMOS: readonly FolderIndexItem[] = [
	{
		description: "One series, several, dates on x, and the curves",
		href: "/chart/line",
		icon: IconAnalytics,
		title: "Line",
	},
	{
		description: "A fill under the line, and three fills stacked",
		href: "/chart/area",
		icon: IconTrending1,
		title: "Area",
	},
	{
		description: "Single, grouped, stacked, horizontal, negative, labelled",
		href: "/chart/bar",
		icon: IconChart1,
		title: "Bar",
	},
	{
		description: "Two series of dots on a numeric x",
		href: "/chart/scatter",
		icon: IconBubbleDots,
		title: "Scatter",
	},
	{
		description: "A fortnight of candles in the sentiment tokens",
		href: "/chart/candlestick",
		icon: IconTradingViewCandles,
		title: "Candlestick",
	},
	{
		description: "A pie, a donut with a centre, labels, and a tap",
		href: "/chart/pie",
		icon: IconPieChart1,
		title: "Pie",
	},
	{
		description: "Grid, axes, tooltip, legend, colours, sizes, the edges",
		href: "/chart/parts",
		icon: IconPuzzle,
		title: "Parts",
	},
	{
		description: "The engine on its own — no theme, every value passed in",
		href: "/chart/engine",
		icon: IconLayersTwo,
		title: "Engine",
	},
];

/**
 * The Chart gallery index — a `FolderIndex`, like the other five.
 *
 * A facet per chart type, because a bar, a candlestick and a pie share a canvas
 * height but nothing else on screen, so one pager of twenty-seven charts would
 * bury the type someone came to see.
 */
export default function ChartGallery(): ReactElement {
	return <FolderIndex items={DEMOS} title="Chart" unit="chart types" />;
}
