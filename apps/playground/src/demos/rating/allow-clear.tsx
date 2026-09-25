import { Rating } from "@delacour/react-native-ui/rating";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Allow clear",
	align: "center",
	caption:
		"With `allowClear`, a tap on the star already held withdraws the rating. A drag that comes back to the same star is still a drag, and never clears.",
};

export function Demo(): ReactElement {
	return (
		<Rating allowClear className="items-center" defaultValue={4}>
			<Rating.Stars accessibilityLabel="Clearable rating" testID="rating-clear" />
			<Rating.Output />
		</Rating>
	);
}
