import { Pagination } from "@delacour/react-native-ui/pagination";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Simple",
	caption: "Two labelled arrows and nothing between them, for a reader who only ever goes one page on.",
	capture: { flow: true },
};

export function Demo(): ReactElement {
	return <Pagination count={8} defaultPage={2} testID="pagination-simple" variant="simple" />;
}
