import { Rating } from "@delacour/react-native-ui/rating";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	align: "center",
	caption:
		"A row of stars and a readout. Tap a star to set it, or drag along the row and the fill follows your finger — the whole row is one target.",
	capture: { flow: "rating/anatomy", hero: true },
};

export function Demo(): ReactElement {
	return (
		<Rating className="items-center" defaultValue={3}>
			<Rating.Stars accessibilityLabel="Your rating" testID="rating-stars" />
			<Rating.Output />
		</Rating>
	);
}
