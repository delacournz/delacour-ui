import { Button } from "@delacour/react-native-ui/button";
import { Menu } from "@delacour/react-native-ui/menu";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long list",
	caption:
		"More rows than the room holds: the panel caps its height inside the safe area and the rows scroll. A drag scrolls without choosing a row.",
	align: "center",
	capture: { frame: "device", flow: "menu/long-list" },
};

const TIME_ZONES = [
	"Pacific/Auckland",
	"Australia/Sydney",
	"Asia/Tokyo",
	"Asia/Shanghai",
	"Asia/Singapore",
	"Asia/Kolkata",
	"Asia/Dubai",
	"Europe/Moscow",
	"Europe/Berlin",
	"Europe/Paris",
	"Europe/London",
	"Atlantic/Reykjavik",
	"America/Sao_Paulo",
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"America/Anchorage",
	"Pacific/Honolulu",
	"Pacific/Pago_Pago",
] as const;

export function Demo(): ReactElement {
	const [zone, setZone] = useState<string>("Pacific/Auckland");

	return (
		<View className="flex-1 items-center justify-center">
			<Menu>
				<Menu.Trigger asChild>
					<Button testID="menu-zone-trigger" variant="outline">
						{zone}
					</Button>
				</Menu.Trigger>
				<Menu.Content maxHeight={360}>
					<Menu.RadioGroup onValueChange={setZone} value={zone}>
						{TIME_ZONES.map((name) => (
							<Menu.RadioItem key={name} testID={`menu-zone-${name}`} value={name}>
								{name.replace("_", " ")}
							</Menu.RadioItem>
						))}
					</Menu.RadioGroup>
				</Menu.Content>
			</Menu>
		</View>
	);
}
