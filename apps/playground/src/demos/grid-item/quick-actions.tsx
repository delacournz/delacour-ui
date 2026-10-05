import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconCalendar1,
	IconCamera1,
	IconFolder1,
	IconHeart,
	IconSettingsGear1,
	IconShareAndroid,
} from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Quick actions",
	caption: "Three columns of small icon tiles — the `sm` size, with the label under the glyph.",
};

const ACTIONS: readonly { id: string; label: string; icon: IconComponent }[] = [
	{ id: "scan", label: "Scan", icon: IconCamera1 },
	{ id: "share", label: "Share", icon: IconShareAndroid },
	{ id: "files", label: "Files", icon: IconFolder1 },
	{ id: "events", label: "Events", icon: IconCalendar1 },
	{ id: "saved", label: "Saved", icon: IconHeart },
	{ id: "settings", label: "Settings", icon: IconSettingsGear1 },
];

export function Demo(): ReactElement {
	return (
		<GridItem.Group columns={3} gap={8} size="sm" variant="muted">
			{ACTIONS.map((action) => (
				<GridItem
					className="items-center justify-center"
					key={action.id}
					onPress={() => {}}
					testID={`action-${action.id}`}
				>
					<GridItem.Media>
						<Icon icon={action.icon} />
					</GridItem.Media>
					<GridItem.Title>{action.label}</GridItem.Title>
				</GridItem>
			))}
		</GridItem.Group>
	);
}
