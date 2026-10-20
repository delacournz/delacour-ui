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
	capture: { flow: true, frame: "device" },
};

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-circle-start" variant="outline">
			Start tour
		</Button>
	);
}

/**
 * Fills and centres because it is captured as a whole screen: the tour is a `Modal`, so a crop to
 * the demo's own bounds would cut the card off. `flex-auto` rather than `flex-1`, so in the
 * gallery's auto-height page it keeps its content's height instead of collapsing.
 */
export function Demo(): ReactElement {
	return (
		<Tour className="flex-auto" testID="tour-circle">
			<View className="flex-auto justify-center gap-4 px-screen-gutter">
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
			</View>
		</Tour>
	);
}
