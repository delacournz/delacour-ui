import { Pagination } from "@delacour/react-native-ui/pagination";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With summary",
	caption:
		"Leading content sits at the start and pushes the arrows to the end; the status reads the page from the pagination.",
	align: "stretch",
};

const PAGE_SIZE = 20;
const TOTAL = 472;

export function Demo(): ReactElement {
	const [page, setPage] = useState(3);

	return (
		<Pagination
			count={Math.ceil(TOTAL / PAGE_SIZE)}
			onPageChange={setPage}
			page={page}
			testID="pagination-summary"
			variant="compact"
		>
			<Pagination.Summary>
				<Pagination.Status pageSize={PAGE_SIZE} total={TOTAL} />
			</Pagination.Summary>
		</Pagination>
	);
}
