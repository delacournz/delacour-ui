import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCompassPointer, IconLightbulbGlow } from "@delacour/react-native-ui/icons/central";
import { Tour, type TourLabels, useTour } from "@delacour/react-native-ui/tour";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom labels",
	caption:
		"`labels` replaces any of the English defaults — the buttons, the progress text and the screen reader's position. `hasSkip={false}` drops Skip, and `isDismissible={false}` stops a scrim tap closing the tour.",
	align: "stretch",
	capture: { flow: true, frame: "device" },
};

const LABELS: Partial<TourLabels> = {
	next: "Suivant",
	back: "Retour",
	finish: "Terminé",
	progress: (current, total) => `${current}/${total}`,
	announcement: (current, total) => `Étape ${current} sur ${total}`,
};

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-labels-start" variant="outline">
			Commencer
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
		<Tour className="flex-auto" hasSkip={false} isDismissible={false} labels={LABELS} testID="tour-labels">
			<View className="flex-auto justify-center gap-4 px-screen-gutter">
				<View className="flex-row justify-center gap-4">
					<Tour.Step description="Trouvez votre chemin." order={1} title="Explorer">
						<Button accessibilityLabel="Explorer" size="icon-md" testID="tour-labels-explore" variant="secondary">
							<Icon icon={IconCompassPointer} />
						</Button>
					</Tour.Step>
					<Tour.Step description="Une idée par jour." order={2} title="Astuces">
						<Button accessibilityLabel="Astuces" size="icon-md" testID="tour-labels-tips" variant="secondary">
							<Icon icon={IconLightbulbGlow} />
						</Button>
					</Tour.Step>
				</View>
				<StartButton />
			</View>
		</Tour>
	);
}
