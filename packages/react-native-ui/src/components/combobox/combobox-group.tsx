import type { ReactNode } from "react";

export type ComboboxGroupProps = {
	/** The heading over the group's rows, announced as a header. */
	label: string;
	/** `Combobox.Item`s. */
	children?: ReactNode;
};

/**
 * A titled run of options, declared as a child of `Combobox`.
 *
 * Renders nothing, like `Combobox.Item`. A group the query empties disappears
 * with its heading.
 */
export function ComboboxGroup(_props: ComboboxGroupProps): null {
	return null;
}
ComboboxGroup.displayName = "DelacourUI.Combobox.Group";
