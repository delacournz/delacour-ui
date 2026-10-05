import { Button } from "@delacour/react-native-ui/button";
import { Chip } from "@delacour/react-native-ui/chip";
import { Drawer } from "@delacour/react-native-ui/drawer";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconFilter1 } from "@delacour/react-native-ui/icons/central";
import { Slider } from "@delacour/react-native-ui/slider";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Filter panel",
	caption:
		"From the end edge, at `lg`. The slider's own drag wins over the drawer's swipe because it claims the touch first; the body does not scroll, so `isScrollable={false}`.",
	align: "center",
	capture: { flow: "drawer/filters", frame: "device" },
};

type Cuisine = "pizza" | "noodles" | "tacos" | "salads" | "curry";

const CUISINES: readonly { id: Cuisine; label: string }[] = [
	{ id: "pizza", label: "Pizza" },
	{ id: "noodles", label: "Noodles" },
	{ id: "tacos", label: "Tacos" },
	{ id: "salads", label: "Salads" },
	{ id: "curry", label: "Curry" },
];

const CURRENCY = { currency: "NZD", style: "currency", maximumFractionDigits: 0 } as const;

export function Demo(): ReactElement {
	const [active, setActive] = useState<ReadonlySet<Cuisine>>(new Set(["noodles"]));
	const [price, setPrice] = useState<number[]>([10, 40]);

	const toggle = (id: Cuisine, isSelected: boolean) =>
		setActive((current) => {
			const next = new Set(current);
			if (isSelected) next.add(id);
			else next.delete(id);
			return next;
		});

	return (
		<View className="grow items-center justify-center">
			<Drawer>
				<Drawer.Trigger asChild>
					<Button testID="drawer-filters-open" variant="outline">
						<Icon icon={IconFilter1} />
						<Button.Label>Filters</Button.Label>
					</Button>
				</Drawer.Trigger>
				<Drawer.Content side="end" size="lg" testID="drawer-filters-panel">
					<Drawer.Header>
						<Drawer.Title>Filters</Drawer.Title>
						<Drawer.Description>
							{active.size} cuisines · up to {price[1]} dollars
						</Drawer.Description>
					</Drawer.Header>
					<Drawer.Body isScrollable={false}>
						<Text.Label>Cuisine</Text.Label>
						<View className="flex-row flex-wrap gap-2">
							{CUISINES.map((cuisine) => (
								<Chip
									color="primary"
									isSelected={active.has(cuisine.id)}
									key={cuisine.id}
									onSelectedChange={(isSelected) => toggle(cuisine.id, isSelected)}
									testID={`drawer-filters-${cuisine.id}`}
									variant="outline"
								>
									<Chip.Label>{cuisine.label}</Chip.Label>
								</Chip>
							))}
						</View>
						<Slider
							formatOptions={CURRENCY}
							maxValue={60}
							onChange={(next) => setPrice(next as number[])}
							step={5}
							value={price}
						>
							<View className="flex-row items-center justify-between">
								<Text.Label>Price per person</Text.Label>
								<Slider.Output />
							</View>
							<Slider.Track>
								{({ values }) => (
									<>
										<Slider.Fill />
										{values.map((_, index) => (
											<Slider.Thumb index={index} key={index} testID={`drawer-filters-thumb-${index}`} />
										))}
									</>
								)}
							</Slider.Track>
						</Slider>
					</Drawer.Body>
					<Drawer.Footer>
						<Button
							onPress={() => {
								setActive(new Set());
								setPrice([0, 60]);
							}}
							testID="drawer-filters-reset"
							variant="ghost"
						>
							Reset
						</Button>
						<Drawer.Close asChild>
							<Button testID="drawer-filters-apply">Show results</Button>
						</Drawer.Close>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer>
		</View>
	);
}
