import { Button } from "@delacour/react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Spaced group",
	caption:
		"`isAttached={false}` keeps the shared variant and size and drops the joined shape. Every member draws its own corner, the run takes a gap, and a press scales again.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<Button.Group isAttached={false} size="sm" testID="spaced-toolbar" variant="outline">
				<Button testID="spaced-find">Find</Button>
				<Button testID="spaced-export">Export</Button>
				<Button testID="spaced-share">Share</Button>
			</Button.Group>
			<Button.Group isAttached={false} testID="spaced-separated" variant="secondary">
				<Button testID="spaced-undo">Undo</Button>
				<Button testID="spaced-redo">Redo</Button>
				<Button.Group.Separator />
				<Button testID="spaced-clear">Clear</Button>
			</Button.Group>
		</View>
	);
}
