import { Children, isValidElement, type ReactNode } from "react";
import { Separator } from "../separator";
import { resolveFrameDivider } from "./frame.variants";

/**
 * Inserts a rule between adjacent children of a tray or a section.
 *
 * Two rows take a rule inset to the rows' padding, the ListGroup convention; a
 * section on either side takes a full-bleed one — see
 * {@link resolveFrameDivider}. A pair is skipped when either side already is a
 * `Separator`, so a hand-placed rule is never doubled, and `Children.toArray`
 * drops the nulls a conditional row leaves, so no rule is stranded before
 * nothing.
 *
 * Its own module because both `Frame.Tray` and `Frame.Section` divide their
 * children, and neither may import the other's helper without one of them
 * reaching into a sibling it otherwise has no business with.
 */
export function withFrameDividers(
	children: ReactNode,
	insetClassName: string,
	isSection: (node: ReactNode) => boolean
): ReactNode[] {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];

	for (const [index, child] of items.entries()) {
		const previous = items[index - 1];
		if (index > 0 && !isSeparator(previous) && !isSeparator(child)) {
			const divider = resolveFrameDivider(isSection(previous), isSection(child));
			output.push(<Separator className={divider === "inset" ? insetClassName : undefined} key={`divider-${index}`} />);
		}
		output.push(child);
	}

	return output;
}

function isSeparator(node: ReactNode): boolean {
	return isValidElement(node) && node.type === Separator;
}
