import { Pagination } from "@delacour/react-native-ui/pagination";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Compact",
	caption: "One readout between the arrows — and one adjustable element for VoiceOver, which swipes a page at a time.",
	capture: { flow: "pagination/compact" },
};

export function Demo(): ReactElement {
	return <Pagination count={12} defaultPage={3} testID="pagination-compact" variant="compact" />;
}
