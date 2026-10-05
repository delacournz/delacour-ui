import { ListGroup } from "@delacour/react-native-ui/list-group";
import { SearchBar } from "@delacour/react-native-ui/search-bar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Debounced filter list",
	caption:
		"`onDebouncedChange` waits 300 ms after the last keystroke before the list filters. The search key filters at once, and clearing restores the full list immediately.",
	capture: { align: "stretch", flow: "search-bar/debounced-filter-list" },
	keyboardAware: true,
};

const CITIES = ["Auckland", "Wellington"] as const;

export function Demo(): ReactElement {
	const [query, setQuery] = useState("");
	const [settled, setSettled] = useState("");
	const results = CITIES.filter((city) => city.toLowerCase().includes(settled.trim().toLowerCase()));

	return (
		<View className="gap-3">
			<SearchBar
				debounce={300}
				onDebouncedChange={setSettled}
				onValueChange={setQuery}
				placeholder="Search cities"
				testID="city-search"
				value={query}
			/>
			<View className="min-h-28">
				{results.length === 0 ? (
					<Text.Caption color="muted">No city matches “{settled}”.</Text.Caption>
				) : (
					<ListGroup>
						{results.map((city) => (
							<ListGroup.Item key={city}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{city}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
							</ListGroup.Item>
						))}
					</ListGroup>
				)}
			</View>
		</View>
	);
}
