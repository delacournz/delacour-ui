import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBookmark, IconHeart } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { Tour, useTour } from "@delacour/react-native-ui/tour";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Interactive",
	caption:
		"`isInteractive` lets touches inside the hole reach the control, and the control's own handler calls `next()`. The tour draws inside its own root rather than a modal — so it dims, and places its card within, only what it wraps; put it around the whole screen.",
	align: "stretch",
	capture: { align: "stretch", flow: true, hero: true },
};

/** The two controls, each advancing the tour when pressed during it. */
function Controls(): ReactElement {
	const tour = useTour();
	const [isLiked, setLiked] = useState(false);
	const [isSaved, setSaved] = useState(false);

	const advanceFrom = (order: number): void => {
		if (tour.isOpen && tour.step === order) tour.next();
	};

	return (
		<View className="flex-row items-center gap-2 rounded-lg border border-border p-3">
			<Text.Paragraph className="flex-1">A recipe card</Text.Paragraph>
			<Tour.Step description="Tap the heart to like this." order={1} title="Like it">
				<Button
					accessibilityLabel={isLiked ? "Unlike" : "Like"}
					onPress={() => {
						setLiked((value) => !value);
						advanceFrom(1);
					}}
					size="icon-md"
					testID="tour-interactive-like"
					variant={isLiked ? "secondary" : "ghost"}
				>
					<Icon icon={IconHeart} />
				</Button>
			</Tour.Step>
			<Tour.Step description="Now save it for later." order={2} title="Save it">
				<Button
					accessibilityLabel={isSaved ? "Unsave" : "Save"}
					onPress={() => {
						setSaved((value) => !value);
						advanceFrom(2);
					}}
					size="icon-md"
					testID="tour-interactive-save"
					variant={isSaved ? "secondary" : "ghost"}
				>
					<Icon icon={IconBookmark} />
				</Button>
			</Tour.Step>
		</View>
	);
}

function StartButton(): ReactElement {
	const tour = useTour();
	return (
		<Button onPress={() => tour.start()} testID="tour-interactive-start" variant="outline">
			Try it
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<Tour className="h-96 flex-none" isInteractive testID="tour-interactive">
			<View className="flex-1 justify-center gap-4">
				<Controls />
				<StartButton />
			</View>
		</Tour>
	);
}
