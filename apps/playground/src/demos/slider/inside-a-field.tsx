import { Field } from "@delacour/native-ui/field";
import { Slider } from "@delacour/native-ui/slider";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a Field",
	note: "isInvalid and isDisabled cascade in from the Field with nothing said at the call site, and an explicit false still opts out — the ?? ladder, never ||.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Field isInvalid>
				<Field.Content>
					<Field.Label>Brightness</Field.Label>
					<Slider defaultValue={55} step={5}>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb testID="thumb-brightness" />
						</Slider.Track>
					</Slider>
					<Field.Error>Pick something under 40.</Field.Error>
				</Field.Content>
			</Field>
			<Field isDisabled>
				<Field.Content>
					<Field.Label>Contrast</Field.Label>
					<Slider defaultValue={55}>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb testID="thumb-contrast" />
						</Slider.Track>
					</Slider>
					<Field.Description>Unavailable while the display is in auto mode.</Field.Description>
				</Field.Content>
			</Field>
			<Field isDisabled>
				<Field.Content>
					<Field.Label>Opted out of the field's disabled state</Field.Label>
					<Slider defaultValue={55} isDisabled={false}>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb testID="thumb-opted-out" />
						</Slider.Track>
					</Slider>
				</Field.Content>
			</Field>
		</View>
	);
}
