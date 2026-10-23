import { BottomSheet, useBottomSheetInput } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { SearchBar } from "@delacour/react-native-ui/search-bar";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a sheet",
	caption:
		"Spread `useBottomSheetInput()` across `inputRef`, `onFocus` and `onBlur`, and the sheet lifts for the keyboard the search bar raises. A fixed snap point holds its height while the search filters the rows.",
	note: "Open the sheet and tap the field: the sheet must grow above the keyboard rather than be covered by it, then hold still while you type — no shrinking as rows drop out. Cancel dismisses the keyboard and the sheet settles back.",
	keyboardAware: true,
};

/** One fixed height: sized to its rows, the sheet would shrink and grow as the search filtered them. */
const SHEET_SNAP_POINTS = ["50%"];

const COUNTRIES = ["Australia", "Canada", "Fiji", "Ireland", "New Zealand", "Samoa", "Tonga"] as const;

/** The bar and its list, registered with the sheet — the hook has to run inside it. */
function CountryPicker({ onPick }: { onPick: (country: string) => void }): ReactElement {
	const sheetInput = useBottomSheetInput();
	const [query, setQuery] = useState("");
	const results = COUNTRIES.filter((country) => country.toLowerCase().includes(query.trim().toLowerCase()));

	return (
		<>
			<SearchBar
				inputRef={sheetInput.ref}
				onBlur={sheetInput.onBlur}
				onFocus={sheetInput.onFocus}
				onValueChange={setQuery}
				placeholder="Search countries"
				testID="sheet-search"
				value={query}
			/>
			<ListGroup>
				{results.map((country) => (
					<ListGroup.Item key={country} onPress={() => onPick(country)}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{country}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				))}
			</ListGroup>
		</>
	);
}

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [country, setCountry] = useState("New Zealand");

	const pick = (next: string) => {
		setCountry(next);
		setOpen(false);
	};

	return (
		<BottomSheet dynamicSizing={false} isOpen={isOpen} onOpenChange={setOpen} snapPoints={SHEET_SNAP_POINTS}>
			<BottomSheet.Trigger asChild>
				<Button testID="open-country-sheet" variant="secondary">
					{country}
				</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Title>Country</BottomSheet.Title>
						<CountryPicker onPick={pick} />
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
