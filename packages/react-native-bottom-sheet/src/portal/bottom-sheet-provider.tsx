import type { ReactElement, ReactNode } from "react";
import { PortalProvider } from "react-native-teleport";
import { BottomSheetHostNameContext } from "./host.context";
import { SheetRegistryProvider } from "./sheet-registry.context";

export type BottomSheetProviderProps = {
	children?: ReactNode;
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
 * Nothing else. `GestureHandlerRootView`, `SafeAreaProvider` and
 * `KeyboardProvider` are the app's — see the package `AGENTS.md`.
 */
export function BottomSheetProvider({ children }: BottomSheetProviderProps): ReactElement {
	return (
		<PortalProvider>
			<SheetRegistryProvider>
				<BottomSheetHostNameContext.Provider value="root">{children}</BottomSheetHostNameContext.Provider>
			</SheetRegistryProvider>
		</PortalProvider>
	);
}
BottomSheetProvider.displayName = "DelacourBottomSheet.BottomSheet.Provider";
