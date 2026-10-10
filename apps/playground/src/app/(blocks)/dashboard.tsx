import { Chart } from "@delacour/react-native-ui/chart";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconDollar, IconPeople, IconReceiptBill } from "@delacour/react-native-ui/icons/central";
import { Kpi } from "@delacour/react-native-ui/kpi";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { REVENUE, REVENUE_CONFIG, SIGNUPS } from "@/blocks/dashboard-data";
import { BlockScreen } from "@/components/block-screen";
import { BlockSection } from "@/components/block-section";
import { SECTION_GAP } from "@/tokens";

/**
 * Dashboard: a pair of KPI tiles, a wide one with a sparkline, and a chart in a tray.
 *
 * The tiles are `Kpi`s on the etched card material through the house, so there is
 * no tile-specific styling here; the chart sits in a tray panel because it is a
 * panel of the same kind as a list.
 */
export default function DashboardBlock(): ReactElement {
	return (
		<BlockScreen subtitle="Block" title="Dashboard">
			<View className={SECTION_GAP}>
				<Text.Kicker>Last 30 days</Text.Kicker>
				<Kpi.Group orientation="horizontal">
					<Kpi material="etched" size="sm">
						<Kpi.Header>
							<Kpi.Icon>
								<Icon icon={IconDollar} />
							</Kpi.Icon>
							<Kpi.Title>Revenue</Kpi.Title>
						</Kpi.Header>
						<Kpi.Content>
							<Kpi.Stat>
								<Kpi.Value>$48.2k</Kpi.Value>
								<Kpi.Trend value={12.4} />
							</Kpi.Stat>
						</Kpi.Content>
					</Kpi>
					<Kpi goodDirection="up" material="etched" size="sm">
						<Kpi.Header>
							<Kpi.Icon>
								<Icon icon={IconPeople} />
							</Kpi.Icon>
							<Kpi.Title>Members</Kpi.Title>
						</Kpi.Header>
						<Kpi.Content>
							<Kpi.Stat>
								<Kpi.Value>1,284</Kpi.Value>
								<Kpi.Trend value={3.1} />
							</Kpi.Stat>
						</Kpi.Content>
					</Kpi>
				</Kpi.Group>
				<Kpi colorIndex={2} goodDirection="down" material="etched">
					<Kpi.Header>
						<Kpi.Icon>
							<Icon icon={IconReceiptBill} />
						</Kpi.Icon>
						<Kpi.Title>Refund rate</Kpi.Title>
					</Kpi.Header>
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Value>2.4%</Kpi.Value>
							<Kpi.Trend value={-0.6} />
						</Kpi.Stat>
						<Kpi.Sparkline data={SIGNUPS} interactive={false} />
					</Kpi.Content>
				</Kpi>
			</View>

			<BlockSection footnote="Revenue in thousands of dollars, by month." kicker="Revenue">
				<Surface className="rounded-xl p-3" variant="default">
					<Chart config={REVENUE_CONFIG} data={REVENUE} includeZero xKey="month">
						<Chart.Grid />
						<Chart.YAxis />
						<Chart.XAxis />
						<Chart.Area yKey="revenue" />
						<Chart.Line yKey="target" />
						<Chart.Legend />
					</Chart>
				</Surface>
			</BlockSection>
		</BlockScreen>
	);
}
