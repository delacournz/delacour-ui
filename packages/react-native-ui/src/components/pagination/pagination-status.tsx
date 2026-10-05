import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { usePaginationContext } from "./pagination.context";
import {
	formatPaginationStatus,
	PAGINATION_DEFAULT_SIZE,
	paginationVariants,
	resolvePaginationStatus,
} from "./pagination.variants";

export type PaginationStatusProps = TextPresetProps & {
	/** The page to describe. Defaults to the enclosing pagination's page, or 1 outside one. */
	page?: number;
	/** Rows per page. */
	pageSize: number;
	/** Rows in the whole result set. */
	total: number;
};

/**
 * "41–60 of 472" — the rows the current page shows. `0–0 of 0` when there are
 * none. Reads the page from the enclosing pagination, so it cannot disagree with
 * the run beside it; a `page` prop lets it stand alone, under a table header.
 */
export function PaginationStatus({ page, pageSize, total, className, ...props }: PaginationStatusProps): ReactElement {
	const root = usePaginationContext();
	const range = resolvePaginationStatus({ page: page ?? root?.page ?? 1, pageSize, total });
	const slots = paginationVariants({ size: root?.size ?? PAGINATION_DEFAULT_SIZE });

	return (
		<Text className={slots.status({ className })} numberOfLines={1} {...props}>
			{formatPaginationStatus(range)}
		</Text>
	);
}
PaginationStatus.displayName = "DelacourUI.Pagination.Status";
