import type { ReactNode } from "react";
import type { IconComponent } from "../icon/icon";
import type { SelectOption } from "./select.types";

export type SelectItemProps = SelectOption & {
	/** A leading glyph in the row. */
	icon?: IconComponent;
	/** Classes for this row. */
	className?: string;
	/** Drawn in place of the label. `label` still names the row for search and screen readers. */
	children?: ReactNode;
};

/**
 * One option, declared as a child of `Select` or `Select.Group`.
 *
 * **It renders nothing.** The root reads these elements' props once, turns
 * them into the same list the `options` prop takes, and draws its rows from
 * that list — never from live children. That is what lets search filter the
 * rows and a virtualised list recycle them: a row inside a `FlatList` cannot be
 * a child element the caller wrote somewhere else in the tree.
 *
 * So an `Select.Item` only works as a direct child of `Select` or of a
 * `Select.Group` (through fragments and arrays). Wrapped in a component of your
 * own it is invisible to the walk — reach for the `options` prop instead.
 */
export function SelectItem(_props: SelectItemProps): null {
	return null;
}
SelectItem.displayName = "DelacourUI.Select.Item";
