import type { IconComponent } from "../icon";

/**
 * A filter shown inside the field as a removable chip.
 *
 * Data rather than a part: tokens are a list the caller already holds — the
 * active filters — so passing the list is shorter than composing a chip per
 * entry, and it leaves one composition model rather than two.
 */
export type SearchBarToken = {
	/** Stable key, and the suffix of the chip's `testID`. */
	id: string;
	label: string;
	icon?: IconComponent;
};

/** What a `ref` on `SearchBar` reaches. */
export type SearchBarHandle = {
	focus: () => void;
	blur: () => void;
	/** Empties the text — reporting it the way the clear button does — and keeps focus. */
	clear: () => void;
};
