import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconChevronDownSmall } from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group separator",
	caption:
		"A split button. The rule takes no position of its own, so the buttons either side of it stay the run's first and last and keep their rounded outer corners.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<Button.Group testID="split-primary">
				<Button testID="split-save">Save</Button>
				<Button.Group.Separator />
				<Button accessibilityLabel="More save options" size="icon-md" testID="split-more">
					<Icon icon={IconChevronDownSmall} />
				</Button>
			</Button.Group>
			<Button.Group testID="split-outline" variant="outline">
				<Button testID="split-export">Export</Button>
				<Button.Group.Separator />
				<Button accessibilityLabel="More export options" size="icon-md" testID="split-format">
					<Icon icon={IconChevronDownSmall} />
				</Button>
			</Button.Group>
		</View>
	);
}
