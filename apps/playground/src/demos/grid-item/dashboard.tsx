import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconAirplane,
	IconBatteryEmpty,
	IconBluetooth,
	IconLock,
	IconMoon,
	IconStorage,
	IconWifiFull,
} from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dashboard",
	caption:
		"Four columns of square cells. A two-by-two tile, small ones beside it, a tall one in the middle and a wide one below — every edge lands on the same columns, and the group is exactly as tall as the rows it used.",
};

export function Demo(): ReactElement {
	return (
		<GridItem.Group columns={4} gap={12}>
			<GridItem colSpan={2} onPress={() => {}} rowSpan={2} testID="tile-storage">
				<GridItem.Media>
					<Icon icon={IconStorage} />
				</GridItem.Media>
				<GridItem.Title>Storage</GridItem.Title>
				<GridItem.Value>74 GB</GridItem.Value>
				<GridItem.Description>of 100 GB used</GridItem.Description>
			</GridItem>
			<GridItem onPress={() => {}} size="sm" testID="tile-wifi">
				<GridItem.Media>
					<Icon icon={IconWifiFull} />
				</GridItem.Media>
				<GridItem.Title>Wi-Fi</GridItem.Title>
			</GridItem>
			<GridItem onPress={() => {}} size="sm" testID="tile-bluetooth">
				<GridItem.Media>
					<Icon icon={IconBluetooth} />
				</GridItem.Media>
				<GridItem.Title>Bluetooth</GridItem.Title>
			</GridItem>
			<GridItem onPress={() => {}} rowSpan={2} size="sm" testID="tile-focus" variant="muted">
				<GridItem.Media>
					<Icon icon={IconMoon} />
				</GridItem.Media>
				<GridItem.Title>Focus</GridItem.Title>
				<GridItem.Footer>
					<GridItem.Description>To 7 am</GridItem.Description>
				</GridItem.Footer>
			</GridItem>
			<GridItem onPress={() => {}} size="sm" testID="tile-airplane" variant="outline">
				<GridItem.Media>
					<Icon icon={IconAirplane} />
				</GridItem.Media>
				<GridItem.Title>Flight</GridItem.Title>
			</GridItem>
			<GridItem colSpan={2} size="sm" testID="tile-battery">
				<GridItem.Media>
					<Icon icon={IconBatteryEmpty} />
				</GridItem.Media>
				<GridItem.Title>Battery</GridItem.Title>
				<GridItem.Value>82%</GridItem.Value>
			</GridItem>
			<GridItem onPress={() => {}} size="sm" testID="tile-lock" variant="outline">
				<GridItem.Media>
					<Icon icon={IconLock} />
				</GridItem.Media>
				<GridItem.Title>Lock</GridItem.Title>
			</GridItem>
		</GridItem.Group>
	);
}
