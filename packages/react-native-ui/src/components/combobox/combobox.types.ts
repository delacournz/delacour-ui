import type { SelectListRow, SelectRowOption, SelectSelectionMode } from "../select/select.types";

/**
 * One choice in a combobox: Select's row option, plus words it also answers to.
 *
 * `keywords` are matched by the default filter but never drawn — "NZ" can find
 * "New Zealand" without the row saying so.
 */
export type ComboboxOption = SelectRowOption & {
	/** Extra text the default filter matches. Never shown. */
	keywords?: readonly string[];
};

/** A titled run of options. A filter that empties it hides its heading too. */
export type ComboboxOptionGroup = {
	label: string;
	options: readonly ComboboxOption[];
};

/** What the `options` prop takes: options and groups, in reading order. */
export type ComboboxOptionInput = ComboboxOption | ComboboxOptionGroup;

/** One option after normalisation, with the heading of the group it came from. */
export type ComboboxEntry = {
	option: ComboboxOption;
	groupLabel?: string;
};

/**
 * How the list answers the query.
 *
 * - `default` — case- and accent-insensitive substring on the label, then on `keywords`.
 * - `custom` — your predicate, called with the raw option and the raw query.
 * - `none` — the options are shown as given. For a server that does the matching.
 */
export type ComboboxFilter =
	| { kind: "default" }
	| { kind: "custom"; match: (option: ComboboxOption, query: string) => boolean }
	| { kind: "none" };

/** Why the query changed. */
export type ComboboxInputChangeReason = "type" | "select" | "clear" | "close";

/** Whether one option or several can be chosen. Select's union, verbatim. */
export type ComboboxSelectionMode = SelectSelectionMode;

/** Where the options open. Grows an anchored member once the library has one. */
export type ComboboxPresentation = "sheet";

/**
 * One row of the sheet's list: Select's heading and option rows, plus the row
 * that accepts the typed text as a value.
 */
export type ComboboxListRow = SelectListRow | { kind: "create"; key: string; query: string };
