import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import type { ComboboxOption, ComboboxOptionInput } from "./combobox.types";
import { ComboboxGroup, type ComboboxGroupProps } from "./combobox-group";
import { ComboboxItem, type ComboboxItemProps } from "./combobox-item";

/** Every element in a children tree, with fragments opened and arrays flattened. */
function flatElements(children: ReactNode): ReactElement[] {
	const out: ReactElement[] = [];
	for (const child of Children.toArray(children)) {
		if (!isValidElement(child)) continue;
		if (child.type === Fragment) {
			out.push(...flatElements((child.props as { children?: ReactNode }).children));
			continue;
		}
		out.push(child);
	}
	return out;
}

/** An item's props as the option the list draws. Absent fields stay absent. */
function toOption({
	value,
	label,
	description,
	isDisabled,
	keywords,
	icon,
	className,
	children,
}: ComboboxItemProps): ComboboxOption {
	return {
		label,
		value,
		...(description === undefined ? {} : { description }),
		...(isDisabled === undefined ? {} : { isDisabled }),
		...(keywords === undefined ? {} : { keywords }),
		...(icon === undefined ? {} : { icon }),
		...(className === undefined ? {} : { className }),
		...(children === undefined || children === null ? {} : { content: children }),
	};
}

/**
 * `Combobox.Item` and `Combobox.Group` children, read into the shape the
 * `options` prop takes.
 *
 * Select's `collectOptions` for Combobox's own markers — the walk has to match
 * on the marker type, and a `Select.Item` cannot carry `keywords`. Pure: it
 * reads props and renders nothing. Anything else is skipped, including a
 * composed `Combobox.Trigger` or `Combobox.Empty`.
 */
export function collectComboboxOptions(children: ReactNode): ComboboxOptionInput[] {
	const out: ComboboxOptionInput[] = [];
	for (const element of flatElements(children)) {
		if (element.type === ComboboxItem) {
			out.push(toOption(element.props as ComboboxItemProps));
		} else if (element.type === ComboboxGroup) {
			const { label, children: groupChildren } = element.props as ComboboxGroupProps;
			const options = flatElements(groupChildren)
				.filter((child) => child.type === ComboboxItem)
				.map((child) => toOption(child.props as ComboboxItemProps));
			out.push({ label, options });
		}
	}
	return out;
}
