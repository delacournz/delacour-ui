import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { MarkerVariant } from "./marker.variants";

export type MarkerContextValue = {
	/** How the marker sits between the entries around it. */
	variant: MarkerVariant;
	/** Whether the marker is disabled. */
	isDisabled: boolean;
	/** Whether any `Marker.Content` inside is shimmering — the step is running. */
	isBusy: boolean;
};

/**
 * How a `Marker.Content` tells the root it is shimmering, so the root can
 * announce itself busy. Returns the matching unregister.
 *
 * Internal: a separate context from {@link MarkerContextValue} so `useMarker()`
 * hands a custom child state to read, not plumbing to call.
 */
export type MarkerShimmerRegistry = () => () => void;

const MarkerContext = createContext<MarkerContextValue | null>(null);
const MarkerShimmerRegistryContext = createContext<MarkerShimmerRegistry | null>(null);

/**
 * Supplies the enclosing marker's variant and state to its subtree.
 *
 * Lives in its own module, importing nothing but `marker.variants`, so a part can
 * read it without importing `./marker` — that import would close a cycle, and
 * Metro serves a partially initialised module for one.
 */
export function MarkerProvider({
	value,
	registerShimmer,
	children,
}: {
	value: MarkerContextValue;
	registerShimmer: MarkerShimmerRegistry;
	children: ReactNode;
}): ReactElement {
	return (
		<MarkerShimmerRegistryContext value={registerShimmer}>
			<MarkerContext value={value}>{children}</MarkerContext>
		</MarkerShimmerRegistryContext>
	);
}
MarkerProvider.displayName = "DelacourUI.Marker.Provider";

/** The enclosing marker's context, or null outside a `<Marker>`. */
export function useMarkerContext(): MarkerContextValue | null {
	return use(MarkerContext);
}

/**
 * Reads the enclosing marker's variant and state, so a custom child can match
 * it. Throws outside a `<Marker>` — use {@link useMarkerContext} where the
 * marker is optional.
 */
export function useMarker(): MarkerContextValue {
	const context = useMarkerContext();
	if (!context) {
		throw new Error("useMarker must be called inside a <Marker>.");
	}
	return context;
}

/**
 * The enclosing marker's context, for a compound part that cannot work without
 * one. Internal: not re-exported from `index.ts`.
 */
export function useMarkerPart(component: string): MarkerContextValue {
	const context = useMarkerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Marker>.`);
	}
	return context;
}

/** The root's shimmer registry, or null outside a `<Marker>`. Internal. */
export function useMarkerShimmerRegistry(): MarkerShimmerRegistry | null {
	return use(MarkerShimmerRegistryContext);
}
