import { Icon } from "@delacour/native-ui/icon";
import {
	IconAnalytics,
	IconBubbleDots,
	IconChart1,
	IconPieChart1,
	IconPuzzle,
	IconTradingViewCandles,
	IconTrending1,
} from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";

const DEMOS = [
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
] as const;

/**
 * The Chart gallery index.
 *
 * A `Screen` rather than a `GalleryScreen`, matching Tabs. A facet per chart
 * type, because a bar, a candlestick and a pie share a canvas height but
 * nothing else on screen, so one pager of twenty-seven charts would bury the
 * type someone came to see.
 */
export default function ChartGallery(): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Chart</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${DEMOS.length} chart types`}</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
				<ListGroup>
					{DEMOS.map((demo) => (
						<ListGroup.Item haptic="selection" key={demo.href} onPress={() => router.push(demo.href)}>
							<ListGroup.ItemPrefix>
								<Icon icon={demo.icon} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{demo.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{demo.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>

				<Text.Caption>
					Every type is one Chart root with a different mark inside it, so the grid, the axes, the tooltip and the
					legend are the same parts whichever mark they sit around. Pie is the exception: it shares no axis with the
					others, so it is a root of its own.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
