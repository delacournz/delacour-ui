import { Slider } from "delacour-react-native-ui/slider";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	note: "One Gesture.Pan on the track drives every thumb. Touching down grabs the nearest one and moves it to the finger, so a press on empty groove lifts the handle it is about to move.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<Slider defaultValue={30}>
			<Slider.Output />
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb testID="slider-thumb" />
			</Slider.Track>
		</Slider>
	);
}
