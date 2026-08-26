import { Slider } from "@delacour/native-ui/slider";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A custom readout",
	note: "Slider.Output takes a function and is handed the settled state, so a scale of words costs nothing but the array to index.",
};

const LOUDNESS = ["Silent", "Quiet", "Comfortable", "Loud", "Very loud"] as const;

export function Demo(): ReactElement {
	return (
		<Slider defaultValue={2} maxValue={4} minValue={0} step={1}>
			<Slider.Output>{({ values }) => LOUDNESS[values[0] ?? 0]}</Slider.Output>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb testID="thumb-loudness" />
			</Slider.Track>
		</Slider>
	);
}
