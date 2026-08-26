import { Slider } from "@delacour/native-ui/slider";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pan versus scroll",
	note: "This whole gallery is a Screen.ScrollArea. A finger starting on the groove must drag the slider and not scroll the page; a finger starting on this caption must scroll normally. minDistance(0) is what wins that race.",
};

export function Demo(): ReactElement {
	return (
		<Slider defaultValue={50} step={5}>
			<Slider.Output />
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb testID="thumb-pan" />
			</Slider.Track>
		</Slider>
	);
}
