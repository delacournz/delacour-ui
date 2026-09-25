import { type ReactElement, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Portal } from "react-native-teleport";
import { composeRefs } from "../lib/compose-refs";
import { useOptionalBottomSheetHostName } from "../portal/host.context";
import { zIndexOf } from "../portal/sheet-registry";
import { useOptionalSheetRegistry } from "../portal/sheet-registry.context";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetPortalProps } from "./bottom-sheet.types";

/**
 * Everything drawn over the app once the sheet is open, inside the frame the
 * sheet measures itself against.
 *
 * **One implementation, two destinations.** With a `BottomSheetProvider`
 * above and no `inline`, the frame is written inside a teleport `Portal`
 * bound to the nearest `BottomSheet.Host` — `root` under a bare provider, or
 * the host a native modal screen wrote last — and the native view moves
 * there while the React tree stays put, so every context the trigger's
 * screen provides still reaches the sheet. Without a provider, or with
 * `inline`, the frame renders where it is written: an absolute fill of the
 * nearest positioned ancestor.
 *
 * The frame is `box-none`: it takes no touch of its own, so a closed sheet
 * leaves the app under it fully interactive. `overflow: hidden` keeps a
 * closed panel — translated to the frame's full height — from drawing under
 * the parent's edge; a detached frame is `overflow: visible`, so nothing of a
 * card sliding out through the gap is cut at any line but the screen's own. The `zIndex` comes from the registry: sheets in one host
 * are siblings, and the later open is the later number.
 *
 * Children mount while the sheet is presented, and stay mounted with
 * `keepMounted` or with `unmountOnClose` off — which is the default for an
 * inline sheet, a persistent drawer. While presented the sheet is in the
 * registry, in its host, and `stackBehavior: "replace"` closes the others
 * there.
 */
export function BottomSheetPortal({
	children,
	style,
	ref,
	inline = false,
	hostName,
	unmountOnClose,
}: BottomSheetPortalProps): ReactElement | null {
	const { presented, keepMounted, topInset, containerLayout, sheetId, stackBehavior, detached } =
		useBottomSheetInternal();
	const registry = useOptionalSheetRegistry();
	const nearest = useOptionalBottomSheetHostName();
	const frameRef = useMemo(() => composeRefs(containerLayout.ref, ref), [containerLayout.ref, ref]);

	const teleported = !inline && nearest !== null;
	const host = hostName ?? nearest ?? "root";
	// An inline sheet is a host of its own: nothing replaces it, and it is always its own top.
	const hostKey = teleported ? host : `inline:${sheetId}`;
	const unmount = keepMounted ? false : (unmountOnClose ?? teleported);
	const mounted = presented || !unmount;

	// Keyed on the two stable callbacks, never on the registry object: its
	// identity carries the state that `present` itself changes, and an effect
	// keyed on it would present, re-render, dismiss and present without end.
	const present = registry?.present;
	const dismissed = registry?.dismissed;
	useEffect(() => {
		if (!presented || present === undefined || dismissed === undefined) return;
		present(sheetId, hostKey, stackBehavior);
		return () => dismissed(sheetId);
	}, [presented, present, dismissed, sheetId, hostKey, stackBehavior]);

	const zIndex = registry === null ? 0 : zIndexOf(registry.state, sheetId);

	if (!mounted) return null;

	const frame = (
		<View
			onLayout={containerLayout.onLayout}
			pointerEvents="box-none"
			ref={frameRef}
			style={[styles.frame, detached === null ? null : styles.frameDetached, { top: topInset, zIndex }, style]}
		>
			{children}
		</View>
	);
	if (!teleported) return frame;

	return (
		<Portal hostName={host} style={[StyleSheet.absoluteFill, { zIndex }]}>
			{frame}
		</Portal>
	);
}
BottomSheetPortal.displayName = "DelacourBottomSheet.BottomSheet.Portal";

const styles = StyleSheet.create({
	frame: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0 },
	frameDetached: { overflow: "visible" },
});
