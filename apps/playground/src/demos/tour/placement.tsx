import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { Tour, useTour } from "@delacour/react-native-ui/tour";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Placement",
	caption:
		"`auto` puts the card below the hole when it fits and above it otherwise. A step can ask for `top` or `bottom`; the tour honours it when it fits and flips when only the other side does.",
	align: "stretch",
};

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-placement-start" variant="outline">
			Start tour
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<Tour className="flex-none gap-4">
			<View className="gap-3">
				<Tour.Step className="rounded-md bg-secondary p-3" order={1} placement="auto" title="auto">
					<Text.Paragraph>Below when it fits.</Text.Paragraph>
				</Tour.Step>
				<Tour.Step className="rounded-md bg-secondary p-3" order={2} placement="top" title="top">
					<Text.Paragraph>Asks for the card above.</Text.Paragraph>
				</Tour.Step>
				<Tour.Step className="rounded-md bg-secondary p-3" order={3} placement="bottom" title="bottom">
					<Text.Paragraph>Asks for the card below.</Text.Paragraph>
				</Tour.Step>
			</View>
			<StartButton />
		</Tour>
	);
}
