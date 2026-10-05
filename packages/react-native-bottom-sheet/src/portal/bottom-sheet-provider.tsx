import type { ReactElement, ReactNode } from "react";
import { PortalProvider } from "react-native-teleport";
import { BottomSheetHostNameContext } from "./host.context";
import { SheetRegistryProvider } from "./sheet-registry.context";

export type BottomSheetProviderProps = {
	children?: ReactNode;
	/**
	 * A teleport `PortalProvider` is already mounted above, so do not mount a
	 * second. Teleport registers hosts natively by name, and two providers
	 * would mean two hosts called `"root"`. Sheets then draw into the outer
	 * provider's `"root"` host. Default `false`.
	 */
	hasPortalProvider?: boolean;
};

/**
 * The one provider this package renders, mounted once by the app — inside its
 * gesture root and keyboard provider, around its navigator.
 *
 * Three things, in one: teleport's `PortalProvider`, which renders its
 * children and then a `root` host that fills them, so a teleported sheet
 * draws over the navigator and the tab bar; the sheet registry, which gives
 * every presented sheet its place in the z-order and lets the app close them
 * without a ref; and the host-name context, set to `"root"`, which is what
 * makes a `Portal` written anywhere below teleport there without being told.
 *
 * `hasPortalProvider` drops the first of the three, for an app that already
 * mounts teleport's provider for something else — `@delacour/react-native-ui`'s
 * `OverlayProvider` is the case it exists for.
 *
 * Nothing else. `GestureHandlerRootView`, `SafeAreaProvider` and
 * `KeyboardProvider` are the app's — see the package `AGENTS.md`.
 */
export function BottomSheetProvider({ children, hasPortalProvider = false }: BottomSheetProviderProps): ReactElement {
	const registry = (
		<SheetRegistryProvider>
			<BottomSheetHostNameContext.Provider value="root">{children}</BottomSheetHostNameContext.Provider>
		</SheetRegistryProvider>
	);
	if (hasPortalProvider) return registry;

	return <PortalProvider>{registry}</PortalProvider>;
}
BottomSheetProvider.displayName = "DelacourBottomSheet.BottomSheet.Provider";
