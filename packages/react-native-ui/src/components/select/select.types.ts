import type { ReactNode } from "react";
import type { IconComponent } from "../icon/icon";

/** One choice in a select. */
export type SelectOption = {
	/** Unique within the list. A duplicate is dropped; the first one wins. */
	value: string;
	/** Plain text: the trigger shows it, a screen reader reads it, and search matches it. */
	label: string;
	/** A second line under the label. */
	description?: string;
	/** Shown, faded and inert — never removed from the list. */
	isDisabled?: boolean;
};

/** A titled run of options. The heading is announced as a header. */
export type SelectOptionGroup = {
	label: string;
	options: readonly SelectOption[];
};

/** What the `options` prop takes: options and groups, in reading order. */
export type SelectOptionInput = SelectOption | SelectOptionGroup;

/**
 * An option as a row draws it: the data, plus what only `Select.Item` can say.
 *
 * `icon`, `className` and `content` come from the declarative form; a
 * data-driven list carries none of them.
 */
export type SelectRowOption = SelectOption & {
	/** A leading glyph. */
	icon?: IconComponent;
	/** Classes for this one row. */
	className?: string;
	/** Drawn in place of the label. The label still names the row for search and screen readers. */
	content?: ReactNode;
};

/** One option after normalisation, with the heading of the group it came from. */
export type SelectEntry = {
	option: SelectRowOption;
	groupLabel?: string;
};

/**
 * One row of the sheet's list: a group heading or an option.
 *
 * The list is flat so it can be virtualised; a heading is a row like any other.
 */
export type SelectListRow =
	| { kind: "heading"; key: string; label: string }
	| { kind: "option"; key: string; option: SelectRowOption; groupLabel?: string };

/** Whether one option or several can be chosen. */
export type SelectSelectionMode = "single" | "multiple";

/** Where the options open. Grows an anchored member once the library has one. */
export type SelectPresentation = "sheet";

/** A run of a label to emphasise, as indices into the original string, `end` exclusive. */
export type SelectHighlightRange = { start: number; end: number };
