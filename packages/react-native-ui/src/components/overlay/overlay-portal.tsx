import { type ReactElement, type ReactNode, useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import { Portal } from "react-native-teleport";
import { useOptionalOverlay } from "./overlay.context";
import { type OverlayLayer, zIndexOfOverlay } from "./overlay-registry";

export type OverlayPortalProps = {
	/** Which band of the z-order this overlay draws in. */
	layer: OverlayLayer;
	children?: ReactNode;
	/**
	 * The overlay's registry id. Pass the same id to `useOverlayBackHandler` so
	 * the back button knows whether this overlay is the top. Defaults to a
	 * `useId()` of the portal's own.
	 */
	id?: string;
	/** Render where it is written instead of teleporting. Default false. */
	isInline?: boolean;
	/** The teleport host. Default `"root"` — the one `OverlayProvider`'s teleport provider fills the app with. */
	hostName?: string;
};

let hasWarnedMissingProvider = false;

/**
 * Draws its children over the whole app, in its layer of the z-order.
 *
 * Teleport moves the native view and leaves the React tree where it was, so
 * every context provided around the overlay's trigger — a theme, a form, a
 * query client — still reaches what the portal draws.
 *
 * The overlay is in the registry for exactly as long as this is mounted, so
 * mount it only while the overlay is present (`useOverlayPresence`). Its
 * wrapper is an absolute fill and `box-none`: it takes no touch of its own, so
 * an overlay with no scrim — a toast, a tooltip — leaves the app under it
 * interactive.
 *
 * Without an `OverlayProvider` above, or with `isInline`, the children render
 * where they are written, in an absolute fill of the nearest positioned
 * ancestor — and the missing provider warns once in development.
 */
export function OverlayPortal({
	layer,
	children,
	id,
	isInline = false,
	hostName = "root",
}: OverlayPortalProps): ReactElement {
	const ownId = useId();
	const overlayId = id ?? ownId;
	const registry = useOptionalOverlay();

	const present = registry?.present;
	const dismissed = registry?.dismissed;
	useEffect(() => {
		if (present === undefined || dismissed === undefined) return;
		present(overlayId, layer);
		return () => dismissed(overlayId);
	}, [present, dismissed, overlayId, layer]);

	useEffect(() => {
		if (!__DEV__ || registry !== null || isInline || hasWarnedMissingProvider) return;
		hasWarnedMissingProvider = true;
		console.warn(
			"Overlay.Portal: an overlay rendered with no <OverlayProvider> above it, so it draws inline and may be clipped. Mount OverlayProvider once at the app root."
		);
	}, [registry, isInline]);

	const zIndex = registry === null ? 0 : zIndexOfOverlay(registry.state, overlayId);
	const frame = (
		<View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex }]}>
			{children}
		</View>
	);

	if (isInline || registry === null) return frame;

	return (
		<Portal hostName={hostName} style={[StyleSheet.absoluteFill, { zIndex }]}>
			{frame}
		</Portal>
	);
}
OverlayPortal.displayName = "DelacourUI.Overlay.Portal";
