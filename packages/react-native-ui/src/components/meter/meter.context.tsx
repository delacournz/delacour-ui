import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { MeterRenderProps } from "./meter.types";
import type { MeterSize } from "./meter.variants";

/**
 * What a meter's own parts read.
 *
 * The continuous track and fill do not read this — the root also publishes the
 * progress bar's context, and `Meter.Track` and `Meter.Fill` are the progress
 * bar's parts reading that. This holds only what a meter adds: the judged colour,
 * the region and the blocks.
 */
export type MeterContextValue = {
	size: MeterSize;
	/** The settled state `Meter.Output` formats and a render function is handed. */
	renderProps: MeterRenderProps;
};

const MeterContext = createContext<MeterContextValue | null>(null);

/**
 * Supplies one meter's state to its own parts.
 *
 * Its own module, importing nothing but React and types, so a part can read it
 * without importing `./meter` and closing a cycle.
 */
export function MeterProvider({ value, children }: { value: MeterContextValue; children: ReactNode }): ReactElement {
	return <MeterContext value={value}>{children}</MeterContext>;
}
MeterProvider.displayName = "DelacourUI.Meter.Provider";

/** The enclosing meter's state, or null outside a `<Meter>`. */
export function useMeterContext(): MeterContextValue | null {
	return use(MeterContext);
}

/**
 * Reads the enclosing meter's state.
 *
 * For a custom readout or legend that has to match the meter it sits in. Throws
 * outside one — use {@link useMeterContext} where the meter is optional.
 */
export function useMeter(): MeterContextValue {
	const context = useMeterContext();
	if (!context) {
		throw new Error("useMeter must be called inside a <Meter>.");
	}
	return context;
}

/**
 * The enclosing meter's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useMeterPart(component: string): MeterContextValue {
	const context = useMeterContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Meter>.`);
	}
	return context;
}
