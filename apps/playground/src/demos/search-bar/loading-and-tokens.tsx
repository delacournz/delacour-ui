import { IconCalendar1, IconTag } from "@delacour/react-native-ui/icons/central";
import { SearchBar, type SearchBarToken } from "@delacour/react-native-ui/search-bar";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading and tokens",
	caption:
		"Active filters sit inside the box as chips, ahead of the text. Remove one with its own control, or press Backspace on an empty field. While a query runs, a spinner takes the clear button's place.",
	align: "stretch",
};

const FILTERS: readonly SearchBarToken[] = [
	{ id: "open", label: "Open", icon: IconTag },
	{ id: "this-week", label: "This week", icon: IconCalendar1 },
];

export function Demo(): ReactElement {
	const [tokens, setTokens] = useState<readonly SearchBarToken[]>(FILTERS);
	const [query, setQuery] = useState("invoice");

	const remove = (token: SearchBarToken) => setTokens((current) => current.filter((entry) => entry.id !== token.id));

	return (
		<View className="gap-4">
			<SearchBar
				onTokenRemove={remove}
				onValueChange={setQuery}
				testID="filtered-search"
				tokens={tokens}
				value={query}
			/>
			<SearchBar defaultValue="Wellington" isLoading testID="loading-search" />
		</View>
	);
}
