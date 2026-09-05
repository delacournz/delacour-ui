import { Badge } from "delacour-react-native-ui/badge";
import { Button } from "delacour-react-native-ui/button";
import { Chart } from "delacour-react-native-ui/chart";
import { Checkbox } from "delacour-react-native-ui/checkbox";
import { Field } from "delacour-react-native-ui/field";
import { Icon } from "delacour-react-native-ui/icon";
import { IconBell, IconGlobe, IconSettingsGear1 } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Radio } from "delacour-react-native-ui/radio";
import { Screen } from "delacour-react-native-ui/screen";
import { Slider } from "delacour-react-native-ui/slider";
import { Spinner } from "delacour-react-native-ui/spinner";
import { Switch } from "delacour-react-native-ui/switch";
import { Tabs } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Most of the library, on one screen",
	caption:
		"A catalogue rather than a story: a segmented bar, a Skia chart, a labelled field, the four selection controls in a row, a slider, and a settings group — every one of them the real component, laid out the way an app would lay them out.",
	capture: { frame: "device" },
};

const TRAFFIC = [
	{ day: "Mon", visits: 120 },
	{ day: "Tue", visits: 186 },
	{ day: "Wed", visits: 154 },
	{ day: "Thu", visits: 241 },
	{ day: "Fri", visits: 309 },
	{ day: "Sat", visits: 284 },
	{ day: "Sun", visits: 338 },
];

const TRAFFIC_CONFIG = { visits: { label: "Visits" } };

const RANGES = [
	{ title: "Overview", value: "overview" },
	{ title: "Activity", value: "activity" },
	{ title: "Team", value: "team" },
] as const;

/**
 * One screen carrying most of the kit, for the documentation site's hero.
 *
 * The other `screen` demos each answer a question about `Screen` itself. This
 * one answers a different question — *what is in the box* — so it is composed
 * for breadth rather than to isolate a behaviour, and it is the one capture on
 * the site that is allowed to be a catalogue.
 *
 * **It has to fit one viewport with nothing cut.** The hero is a still, and
 * `Screen.Footer` defaults to `overlay`, which draws no backing of its own — so
 * content that runs past the fold is sliced by the button rather than fading
 * under it. Adding a block here means taking the height back somewhere else, or
 * dropping the chart a size. The `pt-4` is paid for by the tighter `gap-3`: it
 * has to sit on this view rather than on the scroll area, because content
 * container padding wraps the navbar spacer and would land *behind* the navbar.
 *
 * `Tabs` carries a `Tabs.List` and no `Tabs.Content` on purpose: the segmented
 * bar is the part worth photographing, and a panel below it would spend eighty
 * points saying nothing.
 *
 * **The radio group is wrapped in a `flex-1` view.** `Radio.Group`'s own slot is
 * `w-full`, so as a bare child of a flex row it claims the whole line and pushes
 * whatever follows off the right edge — silently, since nothing overflows
 * visibly. The wrapper is what gives it a share rather than the lot, and even
 * with it the row will not shrink below the group's natural width: the spinner
 * sits up in the badge row, where there is space, rather than being squeezed in
 * beside the switch and clipped by the gutter.
 */
export function Demo(): ReactElement {
	return (
		<Screen>
			<Screen.Navbar
				actions={
					<Button accessibilityLabel="Settings" size="icon-sm" variant="secondary">
						<Icon icon={IconSettingsGear1} />
					</Button>
				}
			>
				<View className="min-w-0 flex-1">
					<Screen.Navbar.Title>Delacour UI</Screen.Navbar.Title>
					<Screen.Navbar.Subtitle>Nineteen components</Screen.Navbar.Subtitle>
				</View>
			</Screen.Navbar>

			<Screen.ScrollArea>
				<View className="gap-3 pt-4">
					<Tabs>
						<Tabs.List>
							<Tabs.Indicator />
							{RANGES.map((range) => (
								<Tabs.Trigger key={range.value} value={range.value}>
									{range.title}
								</Tabs.Trigger>
							))}
						</Tabs.List>
					</Tabs>

					<View className="gap-3">
						<View className="flex-row items-center gap-2">
							<Badge color="success" variant="soft">
								<Badge.StartContent>
									<View className="size-1.5 rounded-full bg-success" />
								</Badge.StartContent>
								<Badge.Label>+12.4%</Badge.Label>
							</Badge>
							<Badge variant="soft">
								<Badge.Label>Last 7 days</Badge.Label>
							</Badge>
							<Spinner color="muted-foreground" size="sm" />
						</View>

						<Chart config={TRAFFIC_CONFIG} data={TRAFFIC} size="sm" xKey="day">
							<Chart.Grid />
							<Chart.YAxis />
							<Chart.XAxis />
							<Chart.Area yKey="visits" />
							<Chart.Line yKey="visits" />
						</Chart>
					</View>

					<Field>
						<Field.Label>Work email</Field.Label>
						<Input defaultValue="ada@delacour.co.nz" />
					</Field>

					<View className="flex-row items-center gap-3">
						<Checkbox color="primary" defaultChecked size="sm" />
						<View className="flex-1">
							<Radio.Group accessibilityLabel="Plan" defaultSelected="pro" orientation="horizontal" size="sm">
								<Radio value="pro">Pro</Radio>
								<Radio value="team">Team</Radio>
							</Radio.Group>
						</View>
						<Switch color="primary" defaultSelected size="sm" />
					</View>

					<Slider defaultValue={62}>
						<View className="flex-row items-center justify-between">
							<Text.Label>Monthly budget</Text.Label>
							<Slider.Output />
						</View>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb />
						</Slider.Track>
					</Slider>

					<ListGroup>
						<ListGroup.Item>
							<ListGroup.ItemPrefix>
								<Icon icon={IconBell} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								<Switch color="primary" defaultSelected size="sm" />
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
						<ListGroup.Item>
							<ListGroup.ItemPrefix>
								<Icon icon={IconGlobe} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Sync over Wi-Fi</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								<Switch size="sm" />
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
					</ListGroup>
				</View>
			</Screen.ScrollArea>

			<Screen.Footer>
				<Button haptic="medium">Get started</Button>
			</Screen.Footer>
		</Screen>
	);
}
