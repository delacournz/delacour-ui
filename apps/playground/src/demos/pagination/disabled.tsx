import { Pagination } from "@delacour/react-native-ui/pagination";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "Every target fades and takes no presses — while a page loads, say.",
	align: "center",
};

export function Demo(): ReactElement {
	return <Pagination count={24} defaultPage={5} isDisabled testID="pagination-disabled" />;
}
