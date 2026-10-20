import { Pagination } from "@delacour/react-native-ui/pagination";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Numbers",
	caption:
		"The run keeps the same number of targets on every page, so the one you are aiming at never slides away. Tap a gap to jump five pages.",
	capture: { flow: true, hero: true },
};

export function Demo(): ReactElement {
	const [page, setPage] = useState(7);

	return <Pagination count={24} onPageChange={setPage} page={page} testID="pagination-numbers" />;
}
