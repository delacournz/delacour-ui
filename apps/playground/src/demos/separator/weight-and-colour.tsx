import { Separator } from "delacour-react-native-ui/separator";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Weight and colour",
	caption: "A filled box, not a border, so thickness and colour are ordinary utilities.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Separator />
			<Separator className="h-0.5" />
			<Separator className="h-1 bg-primary" />
			<Separator className="h-1 rounded-full bg-destructive" />
		</View>
	);
}
