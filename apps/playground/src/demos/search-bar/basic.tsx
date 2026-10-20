import { SearchBar } from "@delacour/react-native-ui/search-bar";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"A search glyph, a clear button once there is text, and Cancel while the field has focus. Clearing keeps the keyboard up; Cancel puts it away.",
	capture: { align: "stretch", flow: true, hero: true },
};

export function Demo(): ReactElement {
	const [query, setQuery] = useState("Wellington");

	return <SearchBar onValueChange={setQuery} testID="search" value={query} />;
}
