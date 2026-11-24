import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from "react";
import {
	type DelacourLabelOverrides,
	type DelacourLabels,
	type DelacourLabelsComponent,
	mergeLabelOverrides,
	resolveLabels,
} from "../lib/labels";

const EMPTY: DelacourLabelOverrides = {};

const LabelsContext = createContext<DelacourLabelOverrides>(EMPTY);

export type LabelsProviderProps = {
	/** Some of each component's labels, laid over the English defaults and any enclosing provider's. */
	labels?: DelacourLabelOverrides;
	children: ReactNode;
};

/**
 * Sets the strings every component beneath it speaks or shows on its own — an arrow's name, a
 * "Page 3 of 12". `DelacourProvider` mounts it from its own `labels`; mount it by hand only in an
 * app that composes its providers itself, or to change a few strings for one subtree.
 *
 * A nested provider merges over its parent per component and per key, so a screen can rename one
 * arrow without restating the app's whole translation.
 *
 * Optional: without one, {@link useLabels} returns English.
 */
export function LabelsProvider({ labels, children }: LabelsProviderProps): ReactElement {
	const outer = useContext(LabelsContext);
	const value = useMemo(() => mergeLabelOverrides(outer, labels), [outer, labels]);
	return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}
LabelsProvider.displayName = "DelacourUI.LabelsProvider";

/**
 * One component's labels: English, then the nearest `LabelsProvider`'s, then `own` — the
 * component's `labels` prop. An `undefined` at any layer leaves the one beneath it.
 *
 * Memoised on `own`'s identity, so pass a stable object (a prop, or a module constant).
 */
export function useLabels<K extends DelacourLabelsComponent>(
	component: K,
	own?: Partial<DelacourLabels[K]>
): DelacourLabels[K] {
	const provider = useContext(LabelsContext);
	return useMemo(() => resolveLabels(component, provider, own), [component, provider, own]);
}
