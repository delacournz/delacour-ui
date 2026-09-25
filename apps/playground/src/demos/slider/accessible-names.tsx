import { Field } from "@delacour/react-native-ui/field";
import { Slider } from "@delacour/react-native-ui/slider";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Accessible names",
	note: "A thumb is a capsule with no text, so it takes its name from the Field.Label a row away — the label alone for one thumb, the label plus the end it holds for a range. With no Field a range still tells its ends apart, and an accessibilityLabel on a thumb wins outright.",
};

/** A range's two thumbs, written out once for the three sliders below. */
function RangeThumbs(): ReactElement {
	return (
		<Slider.Track>
			{({ values }) => (
				<>
					<Slider.Fill />
					{values.map((_, index) => (
						<Slider.Thumb index={index} key={index} testID={`thumb-${index}`} />
					))}
				</>
			)}
		</Slider.Track>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<Field>
				<Field.Label>Volume</Field.Label>
				<Slider defaultValue={40}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-labelled" />
					</Slider.Track>
				</Slider>
			</Field>
			<Field>
				<Field.Label>Price range</Field.Label>
				<Slider color="success" defaultValue={[20, 80]}>
					<Slider.Output />
					<RangeThumbs />
				</Slider>
			</Field>
			<View className="gap-2">
				<Text.Caption color="muted">No Field — reads Minimum and Maximum</Text.Caption>
				<Slider color="info" defaultValue={[30, 70]}>
					<RangeThumbs />
				</Slider>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">accessibilityLabel on each thumb</Text.Caption>
				<Slider color="warning" defaultValue={[10, 90]}>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb accessibilityLabel="Lowest price" index={0} testID="thumb-lowest" />
						<Slider.Thumb accessibilityLabel="Highest price" index={1} testID="thumb-highest" />
					</Slider.Track>
				</Slider>
			</View>
		</View>
	);
}
