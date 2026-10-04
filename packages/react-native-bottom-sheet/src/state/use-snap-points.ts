import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { dynamicSnapPoint, normalizeSnapPoints } from "../core";
import type { SheetSharedState } from "./state.types";

/**
 * The ascending, unique snap points, recomputed on the UI thread whenever the spec,
 * the container or a measurement changes.
 *
 * The dynamic snap point joins the list only once the handle and the content have
 * both reported — before that a sheet sized to its content has no snap point at
 * all, and `layoutReady` keeps an open intent waiting rather than animating to
 * a guess. An explicit snap point equal to the dynamic one is one snap point, not two.
 */
export function useSnapPoints(
	state: SheetSharedState,
	maxHeight: SharedValue<number>,
	band: SharedValue<number>
): SharedValue<readonly number[]> {
	return useDerivedValue<readonly number[]>(() => {
		const available = maxHeight.value;
		const config = state.config.value;
		const snapPoints = normalizeSnapPoints(state.snapPointSpec.value, available);

		if (!config.dynamicSizing || available <= 0) return snapPoints;
		if (state.handleHeight.value < 0 || state.contentHeight.value < 0) return snapPoints;
		if (config.hasFooter && state.footerContentHeight.value < 0) return snapPoints;

		const dynamic = dynamicSnapPoint({
			handleHeight: state.handleHeight.value,
			contentHeight: state.contentHeight.value,
			footerContentHeight: state.footerContentHeight.value,
			band: band.value,
			hasFooter: config.hasFooter,
			available,
			maxDynamicContentSize: config.maxDynamicContentSize,
		});
		if (snapPoints.indexOf(dynamic) !== -1) return snapPoints;

		const merged = [...snapPoints, dynamic];
		merged.sort((a, b) => a - b);
		return merged;
	});
}
