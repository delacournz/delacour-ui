import {
	BottomSheetProvider as HeadlessProvider,
	type BottomSheetProviderProps as HeadlessProviderProps,
} from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { TeleportProvidedContext, useIsTeleportProvided } from "../overlay/overlay.context";

export type BottomSheetProviderProps = Omit<HeadlessProviderProps, "hasPortalProvider">;

/**
 * The engine's provider, mounted once by the app — and aware of
 * `OverlayProvider`.
 *
 * Both providers need teleport's `PortalProvider`, and there must be exactly
 * one: teleport registers hosts natively by name, so two would mean two hosts
 * called `"root"`. Whichever of the two mounts outermost mounts it and says so
 * through `TeleportProvidedContext`; the inner one skips its own. Sheets and
 * overlays then share one `"root"` host, ordered by `zIndex` — every overlay's
 * band starts above every sheet's.
 *
 * The overlay folder's context file is a leaf (rule 3): it imports nothing but
 * React, so this cross-folder import cannot close a cycle.
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
export function BottomSheetProvider({ children }: BottomSheetProviderProps): ReactElement {
	const isTeleportProvided = useIsTeleportProvided();

	return (
		<HeadlessProvider hasPortalProvider={isTeleportProvided}>
			<TeleportProvidedContext.Provider value>{children}</TeleportProvidedContext.Provider>
		</HeadlessProvider>
	);
}
BottomSheetProvider.displayName = "DelacourUI.BottomSheet.Provider";
