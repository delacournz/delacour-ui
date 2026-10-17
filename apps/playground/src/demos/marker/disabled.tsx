import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Marker } from "@delacour/react-native-ui/marker";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "`isDisabled` dims the marker and, on an interactive one, blocks the press and announces it.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<Marker isDisabled onPress={() => {}} testID="disabled-marker">
			<Marker.Icon>
				<Icon icon={IconMagnifyingGlass} />
			</Marker.Icon>
			<Marker.Content>Explored 4 files</Marker.Content>
		</Marker>
	);
}
