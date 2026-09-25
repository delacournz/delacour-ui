import { type ReactElement, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { composeRefs } from "../lib/compose-refs";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetPortalProps } from "./bottom-sheet.types";

/**
 * Everything drawn over the app once the sheet is open, inside the frame the
 * sheet measures itself against.
 *
 * **In place only, for now.** The frame renders where it is written — an
 * absolute fill of the nearest positioned ancestor — and BSHEET-5 adds the
 * other branch: with a `BottomSheetProvider` above and no `inline`, the same
 * frame teleports to the nearest `BottomSheet.Host`. Nothing else in the
 * package changes for that, which is the seam this file is drawn around.
 *
 * The frame is `box-none`: it takes no touch of its own, so a closed sheet
 * leaves the app under it fully interactive. `overflow: hidden` is what keeps
 * a closed panel — translated to the frame's full height — from drawing under
 * the parent's edge.
 *
 * Children mount while the sheet is presented, or always with `keepMounted`
 * or `inline`: an inline sheet is a persistent drawer and never unmounts.
 */
export function BottomSheetPortal({
	children,
	style,
	ref,
	inline = false,
}: BottomSheetPortalProps): ReactElement | null {
	const { presented, keepMounted, topInset, containerLayout } = useBottomSheetInternal();
	const frameRef = useMemo(() => composeRefs(containerLayout.ref, ref), [containerLayout.ref, ref]);
	const mounted = presented || keepMounted || inline;
	if (!mounted) return null;

	return (
		<View
			onLayout={containerLayout.onLayout}
			pointerEvents="box-none"
			ref={frameRef}
			style={[styles.frame, { top: topInset }, style]}
		>
			{children}
		</View>
	);
}
BottomSheetPortal.displayName = "DelacourBottomSheet.BottomSheet.Portal";

const styles = StyleSheet.create({
	frame: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0 },
});
