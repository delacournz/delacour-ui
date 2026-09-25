import { Rating } from "@delacour/react-native-ui/rating";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "More stars",
	align: "center",
	caption: "`maxValue` is the star count. Ten small stars, rated out of ten.",
};

export function Demo(): ReactElement {
	return (
		<Rating className="items-center" defaultValue={7} maxValue={10} size="sm">
			<Rating.Stars accessibilityLabel="Score out of ten" testID="rating-ten" />
			<Rating.Output>{({ value, count }) => `${value} / ${count}`}</Rating.Output>
		</Rating>
	);
}
