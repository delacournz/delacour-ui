import type { ReactElement } from "react";
import { PaginationControl, type PaginationControlProps } from "./pagination-control";

export type PaginationNextProps = PaginationControlProps;

/** Moves forward one page. Disabled on the last page; announced "Next page". */
export function PaginationNext(props: PaginationNextProps): ReactElement {
	return <PaginationControl direction="next" {...props} />;
}
PaginationNext.displayName = "DelacourUI.Pagination.Next";
