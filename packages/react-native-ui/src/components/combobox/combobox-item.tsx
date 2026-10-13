import type { ReactNode } from "react";
import type { IconComponent } from "../icon/icon";
import type { SelectOption } from "../select/select.types";

export type ComboboxItemProps = SelectOption & {
	/** Extra text the default filter matches. Never shown. */
	keywords?: readonly string[];
	/** A leading glyph in the row. */
	icon?: IconComponent;
	/** Classes for this row. */
	className?: string;
	/** Drawn in place of the label. `label` still names the row for filtering and screen readers. */
	children?: ReactNode;
};

/**
 * One option, declared as a child of `Combobox` or `Combobox.Group`.
 *
 * **It renders nothing** — the same contract as `Select.Item`. The root reads
 * these elements' props into the list the `options` prop takes and draws its
 * rows from that, so the filter can drop them and a virtualised list can
 * recycle them. A `Combobox.Item` wrapped in a component of your own is
 * invisible to that walk; use `options` instead.
 */
export function ComboboxItem(_props: ComboboxItemProps): null {
	return null;
}
ComboboxItem.displayName = "DelacourUI.Combobox.Item";
