import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { dynamicDetent, normalizeDetents } from "../core";
import type { SheetSharedState } from "./state.types";

/**
 * The ascending, unique detents, recomputed on the UI thread whenever the spec,
 * the container or a measurement changes.
 *
 * The dynamic detent joins the list only once the handle and the content have
 * both reported — before that a sheet sized to its content has no detent at
 * all, and `layoutReady` keeps an open intent waiting rather than animating to
 * a guess. An explicit detent equal to the dynamic one is one detent, not two.
 */
export function useDetents(
	state: SheetSharedState,
	maxHeight: SharedValue<number>,
	band: SharedValue<number>
): SharedValue<readonly number[]> {
	return useDerivedValue<readonly number[]>(() => {
		const available = maxHeight.value;
		const config = state.config.value;
		const detents = normalizeDetents(state.detentSpec.value, available);

		if (!config.dynamicSizing || available <= 0) return detents;
		if (state.handleHeight.value < 0 || state.contentHeight.value < 0) return detents;
		if (config.hasFooter && state.footerContentHeight.value < 0) return detents;

		const dynamic = dynamicDetent({
			handleHeight: state.handleHeight.value,
			contentHeight: state.contentHeight.value,
			footerContentHeight: state.footerContentHeight.value,
			band: band.value,
			hasFooter: config.hasFooter,
			available,
			maxDynamicContentSize: config.maxDynamicContentSize,
		});
		if (detents.indexOf(dynamic) !== -1) return detents;

		const merged = [...detents, dynamic];
		merged.sort((a, b) => a - b);
		return merged;
	});
}
