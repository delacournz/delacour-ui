import type { ComboboxOption } from "@delacour/react-native-ui/combobox";
import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Server-driven",
	caption:
		'`filter={{ kind: "none" }}` shows `options` as given, so the matching can happen on a server: control the query with `inputValue` and `onInputValueChange`, fetch, and pass `isLoading` while you wait. A picked person stays on the trigger after the results that held them are gone.',
};

const PEOPLE: ComboboxOption[] = [
	{ description: "Design", label: "Aroha Ngata", value: "aroha" },
	{ description: "Engineering", label: "Ben Carter", value: "ben" },
	{ description: "Engineering", label: "Chloé Martin", value: "chloe" },
	{ description: "Product", label: "Dev Patel", value: "dev" },
	{ description: "Design", label: "Emma Wilson", value: "emma" },
	{ description: "Support", label: "Hemi Walker", value: "hemi" },
	{ description: "Engineering", label: "Mei Chen", value: "mei" },
	{ description: "Product", label: "Sione Tupou", value: "sione" },
];

const LATENCY_MS = 600;

/** Stands in for a network request: the people whose name contains the query, after a delay. */
function search(query: string): Promise<ComboboxOption[]> {
	const needle = query.trim().toLowerCase();
	return new Promise((resolve) => {
		setTimeout(() => resolve(PEOPLE.filter((person) => person.label.toLowerCase().includes(needle))), LATENCY_MS);
	});
}

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
	);
}
