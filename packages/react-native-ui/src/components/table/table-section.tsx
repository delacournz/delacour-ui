import { Children, isValidElement, type ReactNode } from "react";
import { TableRowPositionProvider } from "./table.context";
import type { TableSection } from "./table.variants";

/**
 * Wraps each direct child of a section in the position it sits at.
 *
 * This is what lets a body stripe its rows and drop the hairline after its last
 * one without the caller passing `index` or `isLast`. Walks direct children,
 * which a `.map()` is flattened into; a row behind a wrapper still reads its
 * position, because the provider wraps whatever the child is.
 *
 * A header row is never last: the rule under it is what separates it from the
 * body.
 */
export function withRowPositions(children: ReactNode, section: TableSection): ReactNode[] {
	const rows = Children.toArray(children).filter(isValidElement);
	return rows.map((row, index) => (
		<TableRowPositionProvider
			key={row.key ?? index}
			value={{ index, isLast: section !== "header" && index === rows.length - 1, section }}
		>
			{row}
		</TableRowPositionProvider>
	));
}
