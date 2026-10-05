import { Button } from "@delacour/react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Full-width group",
	caption:
		"`isFullWidth` spans the parent and splits it equally, whatever each label says. The parent needs a definite width for there to be anything to split.",
	align: "stretch",
	capture: { align: "stretch", flow: "button/group-full-width" },
};

export function Demo(): ReactElement {
	return (
		<View className="w-full gap-4">
			<Button.Group isFullWidth testID="full-plan" variant="outline">
				<Button testID="full-monthly">Monthly</Button>
				<Button testID="full-annual">Annual</Button>
				<Button testID="full-once">One-off</Button>
			</Button.Group>
			<Button.Group isFullWidth size="sm" testID="full-uneven" variant="secondary">
				<Button testID="full-a">A</Button>
				<Button testID="full-annual-plan">Annual plan</Button>
				<Button testID="full-b">B</Button>
			</Button.Group>
			<Button.Group isAttached={false} isFullWidth testID="full-spaced" variant="outline">
				<Button testID="full-cancel">Cancel</Button>
				<Button testID="full-confirm" variant="primary">
					Confirm
				</Button>
			</Button.Group>
		</View>
	);
}
