import { createContext, useContext } from "react";
import { useLabels } from "../../hooks/use-labels";
import type { BottomSheetLabels } from "../../lib/labels";

/** The root's resolved spoken strings, or `null` outside a `BottomSheet` root. */
export const BottomSheetLabelsContext = createContext<BottomSheetLabels | null>(null);
BottomSheetLabelsContext.displayName = "DelacourUI.BottomSheet.LabelsContext";

/**
 * The spoken strings a part uses: the root's resolved set, or, for a part placed
 * outside any root, the provider's over English.
 */
export function useBottomSheetLabels(): BottomSheetLabels {
	const fromRoot = useContext(BottomSheetLabelsContext);
	const fromProvider = useLabels("bottomSheet");
	return fromRoot ?? fromProvider;
}
