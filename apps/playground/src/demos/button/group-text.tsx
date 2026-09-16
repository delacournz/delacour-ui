import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMinusMedium, IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group text",
	caption:
		"`Button.Group.Text` is a member that says something rather than doing something. It draws the button's own chrome, so its height and corner match the buttons beside it exactly.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<Button.Group testID="stepper" variant="outline">
				<Button accessibilityLabel="Fewer" size="icon-md" testID="stepper-fewer">
					<Icon icon={IconMinusMedium} />
				</Button>
				<Button.Group.Text testID="stepper-count">12 items</Button.Group.Text>
				<Button accessibilityLabel="More" size="icon-md" testID="stepper-more">
					<Icon icon={IconPlusMedium} />
				</Button>
			</Button.Group>
			<Button.Group testID="labelled" variant="outline">
				<Button.Group.Text testID="labelled-unit">https://</Button.Group.Text>
				<Button testID="labelled-domain">delacour.co.nz</Button>
			</Button.Group>
		</View>
	);
}
