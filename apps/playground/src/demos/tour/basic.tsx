import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconMagnifyingGlass, IconSettingsGear1 } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { Tour, useTour } from "@delacour/react-native-ui/tour";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Three steps over a toolbar. The screen dims, a hole opens around the control and the card explains it; Next glides the hole to the next one, Back returns, Skip closes early.",
	align: "stretch",
	capture: { flow: true, frame: "device" },
};

/** Lives inside the tour, so `useTour()` can start it. */
function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-basic-start" variant="outline">
			Show me around
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
		<Tour className="flex-auto" testID="tour-basic">
			<View className="flex-auto justify-center gap-4 px-screen-gutter">
				<View className="flex-row items-center justify-between rounded-lg border border-border p-2">
					<Text.Label className="ps-2">Library</Text.Label>
					<View className="flex-row gap-1">
						<Tour.Step description="Find anything in your library by title or tag." order={1} title="Search">
							<Button accessibilityLabel="Search" size="icon-md" testID="tour-basic-search" variant="ghost">
								<Icon icon={IconMagnifyingGlass} />
							</Button>
						</Tour.Step>
						<Tour.Step description="Replies and mentions land here." order={2} title="Notifications">
							<Button accessibilityLabel="Notifications" size="icon-md" testID="tour-basic-bell" variant="ghost">
								<Icon icon={IconBell} />
							</Button>
						</Tour.Step>
						<Tour.Step description="Theme, account and sync." order={3} title="Settings">
							<Button accessibilityLabel="Settings" size="icon-md" testID="tour-basic-settings" variant="ghost">
								<Icon icon={IconSettingsGear1} />
							</Button>
						</Tour.Step>
					</View>
				</View>
				<StartButton />
			</View>
		</Tour>
	);
}
