import { Button } from "@delacour/react-native-ui/button";
import { Popover } from "@delacour/react-native-ui/popover";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Unstyled",
	caption:
		"`isUnstyled` drops the surface, border, corner and padding. `background` draws your own behind the content.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Popover>
			<Popover.Trigger asChild>
				<Button testID="open-popover" variant="outline">
					Custom surface
				</Button>
			</Popover.Trigger>
			<Popover.Content background={<View className="flex-1 rounded-3xl bg-primary" />} className="px-5 py-4" isUnstyled>
				<Text.Label className="text-primary-foreground">Drawn by the caller.</Text.Label>
			</Popover.Content>
		</Popover>
	);
}
