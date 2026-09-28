import { createContext, useContext } from "react";

/**
 * The name of the nearest `BottomSheet.Host` above a sheet — `"root"` under a
 * bare `BottomSheetProvider`, the host's own name under one written inside a
 * native modal. A `Portal` with no `hostName` of its own teleports here.
 *
 * `null` means no provider at all, and a portal renders in place.
 */
export const BottomSheetHostNameContext = createContext<string | null>(null);
BottomSheetHostNameContext.displayName = "DelacourBottomSheet.HostNameContext";

export function useBottomSheetHostName(): string {
	const value = useContext(BottomSheetHostNameContext);
	if (value === null) {
		throw new Error(
			"[@delacour/react-native-bottom-sheet] useBottomSheetHostName outside <BottomSheetProvider>. Mount the provider at the app root."
		);
	}
	return value;
}

export function useOptionalBottomSheetHostName(): string | null {
	return useContext(BottomSheetHostNameContext);
}
