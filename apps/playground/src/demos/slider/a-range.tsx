import { Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A range",
	note: "A range's thumb count is data, so the track takes a function and maps over the values it is handed. Neither thumb can pass the other, and the fill spans between them rather than starting at the minimum.",
	capture: { align: "stretch" },
};

const CURRENCY = { currency: "NZD", style: "currency", maximumFractionDigits: 0 } as const;

export function Demo(): ReactElement {
	const [price, setPrice] = useState<number[]>([200, 800]);

	return (
		<Slider
			color="success"
			formatOptions={CURRENCY}
			maxValue={1000}
			onChange={(next) => setPrice(next as number[])}
			step={10}
			value={price}
		>
			<View className="flex-row items-center justify-between">
				<Text.Label>Price range</Text.Label>
				<Slider.Output />
			</View>
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
		</Slider>
	);
}
