import { useLabels } from "../../hooks/use-labels";
import type { ScreenLabels } from "../../lib/labels";
import { useScreenContext } from "./screen.context";

/**
 * A screen part's labels, by the rule `ScreenRoot` follows: with no `labels` of its own it keeps the
 * enclosing screen's, so a `Screen.Loading` inside a translated `<Screen>` speaks what its back
 * button does; with its own, they sit over `DelacourProvider`'s, which sit over English.
 */
export function useScreenLabels(own: Partial<ScreenLabels> | undefined): ScreenLabels {
	const resolved = useLabels("screen", own);
	const enclosing = useScreenContext()?.labels;
	return own === undefined && enclosing ? enclosing : resolved;
}
