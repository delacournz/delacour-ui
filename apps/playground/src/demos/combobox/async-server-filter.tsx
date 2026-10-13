import type { ComboboxOption } from "@delacour/react-native-ui/combobox";
import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Server-driven",
	caption:
		'`filter={{ kind: "none" }}` shows `options` as given, so the matching can happen on a server: control the query with `inputValue` and `onInputValueChange`, fetch, and pass `isLoading` while you wait. A picked person stays on the trigger after the results that held them are gone.',
	capture: { flow: "combobox/async-server-filter", frame: "device" },
};

const PEOPLE: ComboboxOption[] = [
	{ description: "Engineering", label: "Aria Whitlock", value: "aria" },
	{ description: "Support", label: "Isla Brennan", value: "isla" },
	{ description: "Product", label: "Kenji Moriyama", value: "kenji" },
	{ description: "Product", label: "Lena Varga", value: "lena" },
	{ description: "Design", label: "Ngaio Fraser", value: "ngaio" },
	{ description: "Engineering", label: "Omar Haddad", value: "omar" },
	{ description: "Engineering", label: "Rawiri Kemp", value: "rawiri" },
	{ description: "Design", label: "Tomasi Fifita", value: "tomasi" },
];

const LATENCY_MS = 600;

/** Stands in for a network request: the people whose name contains the query, after a delay. */
function search(query: string): Promise<ComboboxOption[]> {
	const needle = query.trim().toLowerCase();
	return new Promise((resolve) => {
		setTimeout(() => resolve(PEOPLE.filter((person) => person.label.toLowerCase().includes(needle))), LATENCY_MS);
	});
}

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * the capture stage hands a `device` demo the full window with no gutter, and
 * the sheet it opens needs the screen to rise over.
 */
export function Demo(): ReactElement {
	const [assignee, setAssignee] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ComboboxOption[]>([]);
	const [isFetching, setFetching] = useState(false);

	useEffect(() => {
		let isCurrent = true;
		setFetching(true);
		search(query).then((people) => {
			if (!isCurrent) return;
			setResults(people);
			setFetching(false);
		});
		return () => {
			isCurrent = false;
		};
	}, [query]);

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Combobox
				filter={{ kind: "none" }}
				inputValue={query}
				isClearable
				isLoading={isFetching}
				onInputValueChange={setQuery}
				onValueChange={setAssignee}
				options={results}
				placeholder="Assign someone"
				searchPlaceholder="Search people"
				testID="combobox-server"
				title="Assignee"
				value={assignee}
			/>
		</View>
	);
}
