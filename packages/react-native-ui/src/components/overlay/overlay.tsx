import { type ReactElement, type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { PortalProvider } from "react-native-teleport";
import {
	OverlayContext,
	type OverlayContextValue,
	TeleportProvidedContext,
	useIsTeleportProvided,
} from "./overlay.context";
import { OverlayPortal } from "./overlay-portal";
import {
	INITIAL_OVERLAY_REGISTRY,
	type OverlayLayer,
	type OverlayRegistryState,
	reduceOverlayRegistry,
} from "./overlay-registry";
import { OverlayScrim } from "./overlay-scrim";

export type OverlayProviderProps = {
	children?: ReactNode;
};

function OverlayRoot({ children }: OverlayProviderProps): ReactElement {
	const isTeleportProvided = useIsTeleportProvided();
	const current = useRef<OverlayRegistryState>(INITIAL_OVERLAY_REGISTRY);
	const [state, setState] = useState<OverlayRegistryState>(INITIAL_OVERLAY_REGISTRY);

	const present = useCallback((id: string, layer: OverlayLayer) => {
		current.current = reduceOverlayRegistry(current.current, { type: "open", id, layer });
		setState(current.current);
	}, []);

	const dismissed = useCallback((id: string) => {
		const next = reduceOverlayRegistry(current.current, { type: "close", id });
		if (next === current.current) return;
		current.current = next;
		setState(next);
	}, []);

	const value = useMemo<OverlayContextValue>(() => ({ state, present, dismissed }), [state, present, dismissed]);

	const registry = <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
	if (isTeleportProvided) return registry;

	return (
		<PortalProvider>
			<TeleportProvidedContext.Provider value>{registry}</TeleportProvidedContext.Provider>
		</PortalProvider>
	);
}

/**
 * The layer every overlay in this library draws into. Mount it once, inside
 * `DelacourProvider` and around the navigator — and around
 * `BottomSheetProvider` when the app has sheets.
 *
 * Two things. Teleport's `PortalProvider`, whose `"root"` host fills the app
 * and is where every dialog, drawer, popover, tooltip, toast and sheet draws —
 * skipped when a provider above already mounted one, because two would mean
 * two native hosts with one name. And the overlay registry, which gives every
 * presented overlay a `zIndex` in its layer's band and tells each one whether it
 * is the top, the one Android's back button closes.
 *
 * `DelacourProvider` cannot mount this, for the reason it cannot mount
 * `BottomSheetProvider`: `react-native-teleport` is an optional peer, and an
 * import there would make every app resolve it.
 *
 * `OverlayProvider` is the same component under the name a root layout reads
 * best with; `Overlay.Portal` and `Overlay.Scrim` are the parts every overlay
 * is drawn with.
 *
 * @example
 * <DelacourProvider>
 *   <OverlayProvider>
 *     <BottomSheetProvider>
 *       <Stack />
 *     </BottomSheetProvider>
 *   </OverlayProvider>
 * </DelacourProvider>
 */
export const Overlay = Object.assign(OverlayRoot, {
	/** Teleports its children over the app, in a layer of the z-order. */
	Portal: OverlayPortal,
	/** The dim layer under a modal overlay, faded by presence. */
	Scrim: OverlayScrim,
	displayName: "DelacourUI.Overlay",
});

/** `Overlay` under the name a root layout reads best with. */
export const OverlayProvider = Overlay;
