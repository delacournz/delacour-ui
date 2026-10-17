import type { ReactElement } from "react";
import { PaginationControl, type PaginationControlProps } from "./pagination-control";

export type PaginationPreviousProps = PaginationControlProps;

/** Moves back one page. Disabled on the first page; announced "Previous page". */
export function PaginationPrevious(props: PaginationPreviousProps): ReactElement {
	return <PaginationControl direction="previous" {...props} />;
}
PaginationPrevious.displayName = "DelacourUI.Pagination.Previous";
