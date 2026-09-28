import { type ComponentProps, type ReactElement, type ReactNode, useEffect } from "react";
import { StyleSheet } from "react-native";
import { PortalHost } from "react-native-teleport";
import { useOptionalBottomSheetInternal } from "../components/bottom-sheet.context";
import { BottomSheetHostNameContext, useOptionalBottomSheetHostName } from "./host.context";

export type BottomSheetHostProps = {
	/** What a `Portal`'s `hostName` names. Unique across the mounted hosts. */
	name: string;
	/** Typed as `PortalHost`'s own, which is where it lands. */
	style?: ComponentProps<typeof PortalHost>["style"];
	/**
	 * The screen the host serves. A sheet written inside targets this host
	 * without a `hostName`, and teleport draws every portal over the children,
	 * so the host is the screen's outermost view. With no children it is an
	 * absolute fill instead, written last in the screen, and a sheet elsewhere
	 * in that screen names it with `hostName`.
	 */
	children?: ReactNode;
};

/**
 * A place for sheets to teleport to, other than the app root.
 *
 * The recipe for a native modal: a `Modal`, or a navigator screen presented
 * as one, is its own window, and a sheet teleported to the root host draws
 * behind it. Write `<BottomSheet.Host name="modal" />` last in that screen
 * and every sheet written in the screen lands there — the host provides its
 * own name as the nearest one, so no `Portal` needs telling.
 *
 * An absolute fill that takes no touch of its own, so the screen under it
 * stays interactive until a sheet opens over it.
 *
 * A host inside a sheet is a mistake this warns about in development: a
 * sheet teleported into another sheet's panel is clipped by that panel and
 * moves with it.
 */
export function BottomSheetHost({ name, style, children }: BottomSheetHostProps): ReactElement {
	const insideSheet = useOptionalBottomSheetInternal() !== null;
	const provided = useOptionalBottomSheetHostName() !== null;

	useEffect(() => {
		if (!__DEV__) return;
		if (insideSheet) {
			console.warn(
				`[@delacour/react-native-bottom-sheet] <BottomSheet.Host name="${name}"> is rendered inside a sheet. A host belongs in a screen, written last; a sheet teleported into another sheet's panel is clipped by it.`
			);
		}
		if (!provided) {
			console.warn(
				`[@delacour/react-native-bottom-sheet] <BottomSheet.Host name="${name}"> has no <BottomSheetProvider> above it. Mount the provider at the app root.`
			);
		}
	}, [insideSheet, provided, name]);

	return (
		<BottomSheetHostNameContext.Provider value={name}>
			<PortalHost name={name} style={[children === undefined ? StyleSheet.absoluteFill : styles.fill, style]}>
				{children}
			</PortalHost>
		</BottomSheetHostNameContext.Provider>
	);
}
BottomSheetHost.displayName = "DelacourBottomSheet.BottomSheet.Host";

const styles = StyleSheet.create({
	fill: { flex: 1 },
});
