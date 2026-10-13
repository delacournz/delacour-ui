import type { ReactNode } from "react";

export type SelectGroupProps = {
	/** The heading over the group's rows, announced as a header. */
	label: string;
	/** `Select.Item`s. */
	children?: ReactNode;
};

/**
 * A titled run of options, declared as a child of `Select`.
 *
 * Like `Select.Item`, it renders nothing: the root reads it into the same
 * shape the `options` prop's groups take. A group that a search empties
 * disappears with its heading.
 */
export function SelectGroup(_props: SelectGroupProps): null {
	return null;
}
SelectGroup.displayName = "DelacourUI.Select.Group";
