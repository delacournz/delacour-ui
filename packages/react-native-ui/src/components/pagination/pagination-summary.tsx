import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { usePaginationPart } from "./pagination.context";
import { paginationVariants } from "./pagination.variants";

export type PaginationSummaryProps = ViewProps & { className?: string };

/**
 * Leading content beside the run — a status line, a page-size picker. It grows
 * to fill the row, which is what pushes the run to the trailing edge.
 */
export function PaginationSummary({ className, ...props }: PaginationSummaryProps): ReactElement {
	const root = usePaginationPart("Pagination.Summary");
	return <View className={paginationVariants({ size: root.size }).summary({ className })} {...props} />;
}
PaginationSummary.displayName = "DelacourUI.Pagination.Summary";
