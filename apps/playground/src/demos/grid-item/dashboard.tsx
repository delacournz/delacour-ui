import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconAirplane,
	IconBatteryEmpty,
	IconBluetooth,
	IconLock,
	IconMoon,
	IconStorage,
	IconWifiFull,
} from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dashboard",
	caption:
		"Four columns of square cells. A two-by-two tile, small ones beside it, a tall one in the middle and a wide one below — every edge lands on the same columns, and the group is exactly as tall as the rows it used. Tap a toggle and its tile fills.",
	capture: { align: "stretch", flow: "grid-item/dashboard", hero: true },
};

type ToggleId = "wifi" | "bluetooth" | "focus" | "airplane" | "lock";

type Toggle = { id: ToggleId; title: string; icon: IconComponent };

const TOGGLES: Record<ToggleId, Toggle> = {
	wifi: { id: "wifi", title: "Wi-Fi", icon: IconWifiFull },
	bluetooth: { id: "bluetooth", title: "Bluetooth", icon: IconBluetooth },
	focus: { id: "focus", title: "Focus", icon: IconMoon },
	airplane: { id: "airplane", title: "Flight", icon: IconAirplane },
	lock: { id: "lock", title: "Lock", icon: IconLock },
};

const INITIAL: Record<ToggleId, boolean> = { wifi: true, bluetooth: true, focus: false, airplane: false, lock: true };

/**
 * A tile that switches on and off. It takes `rowSpan` and passes it on: the
 * group reads spans from its direct children's props, so a wrapper has to.
 */
function ToggleTile({
	toggle,
	isOn,
	onToggle,
	rowSpan,
}: {
	toggle: Toggle;
	isOn: boolean;
	onToggle: (id: ToggleId) => void;
	rowSpan?: number;
}): ReactElement {
	return (
		<GridItem
			accessibilityState={{ checked: isOn }}
			haptic="selection"
			onPress={() => onToggle(toggle.id)}
			rowSpan={rowSpan}
			size="sm"
			testID={`tile-${toggle.id}`}
			variant={isOn ? "muted" : "outline"}
		>
			<GridItem.Media>
				<Icon icon={toggle.icon} />
			</GridItem.Media>
			<GridItem.Title>{toggle.title}</GridItem.Title>
			<GridItem.Description>{isOn ? "On" : "Off"}</GridItem.Description>
		</GridItem>
	);
}

export function Demo(): ReactElement {
	const [isOn, setIsOn] = useState(INITIAL);
	const onToggle = (id: ToggleId) => setIsOn((current) => ({ ...current, [id]: !current[id] }));

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
			<ToggleTile isOn={isOn.wifi} onToggle={onToggle} toggle={TOGGLES.wifi} />
			<ToggleTile isOn={isOn.bluetooth} onToggle={onToggle} toggle={TOGGLES.bluetooth} />
			<ToggleTile isOn={isOn.focus} onToggle={onToggle} rowSpan={2} toggle={TOGGLES.focus} />
			<ToggleTile isOn={isOn.airplane} onToggle={onToggle} toggle={TOGGLES.airplane} />
			<GridItem colSpan={2} size="sm" testID="tile-battery">
				<GridItem.Media>
					<Icon icon={IconBatteryEmpty} />
				</GridItem.Media>
				<GridItem.Title>Battery</GridItem.Title>
				<GridItem.Value>82%</GridItem.Value>
			</GridItem>
			<ToggleTile isOn={isOn.lock} onToggle={onToggle} toggle={TOGGLES.lock} />
		</GridItem.Group>
	);
}
