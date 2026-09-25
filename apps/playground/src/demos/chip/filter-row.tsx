import { Button } from "@delacour/react-native-ui/button";
import { Chip } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconBurger,
	IconFilter1,
	IconGlobe,
	IconHeart,
	IconPizza,
	IconStar,
} from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { type ComponentProps, type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Filter row",
	caption:
		"Controlled, multi-select. The screen owns the set and the chips report into it — the count and the clear action read the same state the chips paint.",
	capture: { align: "stretch", hero: true },
};

type Cuisine = "pizza" | "burgers" | "world" | "favourites" | "top-rated";

const FILTERS: readonly { id: Cuisine; label: string; icon: ComponentProps<typeof Icon>["icon"] }[] = [
	{ id: "pizza", label: "Pizza", icon: IconPizza },
	{ id: "burgers", label: "Burgers", icon: IconBurger },
	{ id: "world", label: "World food", icon: IconGlobe },
	{ id: "favourites", label: "Favourites", icon: IconHeart },
	{ id: "top-rated", label: "4.5+", icon: IconStar },
];

/** How many places a filter set would leave, so the count moves with every tap. */
function resultCount(active: ReadonlySet<Cuisine>): number {
	return active.size === 0 ? 128 : Math.max(3, 128 - active.size * 27);
}

export function Demo(): ReactElement {
	const [active, setActive] = useState<ReadonlySet<Cuisine>>(new Set(["pizza", "top-rated"]));

	const toggle = (id: Cuisine, isSelected: boolean) =>
		setActive((current) => {
			const next = new Set(current);
			if (isSelected) next.add(id);
			else next.delete(id);
			return next;
		});

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{FILTERS.map((filter) => (
					<Chip
						color="primary"
						isSelected={active.has(filter.id)}
						key={filter.id}
						onSelectedChange={(isSelected) => toggle(filter.id, isSelected)}
						testID={`filter-${filter.id}`}
						variant="outline"
					>
						<Icon icon={filter.icon} />
						<Chip.Label>{filter.label}</Chip.Label>
					</Chip>
				))}
			</View>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center gap-1.5">
					<Icon color="muted-foreground" icon={IconFilter1} size="sm" />
					<Text.Caption color="muted" testID="result-count">
						{active.size === 0 ? "No filters" : `${active.size} active`} · {resultCount(active)} places
					</Text.Caption>
				</View>
				<Button
					isDisabled={active.size === 0}
					onPress={() => setActive(new Set())}
					size="sm"
					testID="clear-filters"
					variant="ghost"
				>
					Clear
				</Button>
			</View>
		</View>
	);
}
