import { Button } from "@delacour/react-native-ui/button";
import { Popover } from "@delacour/react-native-ui/popover";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Edge collision",
	caption:
		"Every trigger asks for a panel below it and centred. Near the bottom it flips above; at either side it slides inward and the arrow keeps pointing at the trigger.",
};

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const CORNERS: Record<Corner, string> = {
	"top-left": "items-start justify-start",
	"top-right": "items-end justify-start",
	"bottom-left": "items-start justify-end",
	"bottom-right": "items-end justify-end",
};

function CornerPopover({ corner }: { corner: Corner }): ReactElement {
	return (
		<Popover>
			<Popover.Trigger asChild>
				<Button size="icon-sm" testID={`open-${corner}`} variant="secondary">
					•
				</Button>
			</Popover.Trigger>
			<Popover.Content className="w-56">
				<Popover.Arrow />
				<Text.Label>Asked for bottom, centre.</Text.Label>
				<Text.Caption>Placed where it fits.</Text.Caption>
			</Popover.Content>
		</Popover>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="h-[520px] flex-row flex-wrap">
			{(Object.keys(CORNERS) as Corner[]).map((corner) => (
				<View className={`h-1/2 w-1/2 ${CORNERS[corner]}`} key={corner}>
					<CornerPopover corner={corner} />
				</View>
			))}
		</View>
	);
}
