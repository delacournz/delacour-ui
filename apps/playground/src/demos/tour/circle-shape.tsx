import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPlusMedium } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { Tour, useTour } from "@delacour/react-native-ui/tour";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Circle shape",
	caption:
		"`shape=\"circle\"` on a step cuts a round hole — a square around the target's larger side — for a floating button. The first step keeps the tour's rounded rectangle, and the hole morphs between them.",
	align: "stretch",
};

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-circle-start" variant="outline">
			Start tour
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<Tour className="flex-none gap-4">
			<View className="h-40 justify-between rounded-lg border border-border p-4">
				<Tour.Step description="Everything you have written, newest first." order={1} title="Your notes">
					<Text.Header>Notes</Text.Header>
				</Tour.Step>
				<View className="items-end">
					<Tour.Step description="Start a new note." order={2} padding={6} shape="circle" title="New note">
						<Button accessibilityLabel="New note" className="rounded-full" size="icon-md" testID="tour-circle-fab">
							<Icon icon={IconPlusMedium} />
						</Button>
					</Tour.Step>
				</View>
			</View>
			<StartButton />
		</Tour>
	);
}
