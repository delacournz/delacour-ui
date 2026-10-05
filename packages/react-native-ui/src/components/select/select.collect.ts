import { Children, type ComponentType, isValidElement, type ReactElement, type ReactNode } from "react";
import type { SelectRowOption } from "./select.types";
import type { SelectRowOptionGroup } from "./select.variants";
import { SelectGroup, type SelectGroupProps } from "./select-group";
import { SelectItem, type SelectItemProps } from "./select-item";

/** Every element in a children tree, with fragments opened and arrays flattened. */
function flatElements(children: ReactNode): ReactElement[] {
	const out: ReactElement[] = [];
	for (const child of Children.toArray(children)) {
		if (!isValidElement(child)) continue;
		if (child.type === Symbol.for("react.fragment")) {
			out.push(...flatElements((child.props as { children?: ReactNode }).children));
			continue;
		}
		out.push(child);
	}
	return out;
}

/** An item's props as the row option the list draws. Absent fields stay absent. */
function toRowOption({
	value,
	label,
	description,
	isDisabled,
	icon,
	className,
	children,
}: SelectItemProps): SelectRowOption {
	return {
		label,
		value,
		...(description === undefined ? {} : { description }),
		...(isDisabled === undefined ? {} : { isDisabled }),
		...(icon === undefined ? {} : { icon }),
		...(className === undefined ? {} : { className }),
		...(children === undefined || children === null ? {} : { content: children }),
	};
}

/** The items directly inside a children tree. */
function collectItems(children: ReactNode): SelectRowOption[] {
	return flatElements(children)
		.filter((element) => element.type === SelectItem)
		.map((element) => toRowOption(element.props as SelectItemProps));
}

/**
 * `Select.Item` and `Select.Group` children, read into the shape the `options`
 * prop takes.
 *
 * Pure — it reads props and renders nothing — so the declarative form and the
 * data-driven one meet at `normalizeOptions` and the rows are drawn the same
 * way from either. Anything that is neither an item nor a group is skipped,
 * including a composed `Select.Trigger`.
 */
export function collectOptions(children: ReactNode): (SelectRowOption | SelectRowOptionGroup)[] {
	const out: (SelectRowOption | SelectRowOptionGroup)[] = [];
	for (const element of flatElements(children)) {
		if (element.type === SelectItem) {
			out.push(toRowOption(element.props as SelectItemProps));
		} else if (element.type === SelectGroup) {
			const { label, children: groupChildren } = element.props as SelectGroupProps;
			out.push({ label, options: collectItems(groupChildren) });
		}
	}
	return out;
}

/** The first direct child (through fragments) of the given component type, or null. */
export function findChildOfType(children: ReactNode, type: ComponentType<never>): ReactElement | null {
	return flatElements(children).find((element) => element.type === type) ?? null;
}
