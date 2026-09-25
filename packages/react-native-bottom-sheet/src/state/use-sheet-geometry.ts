import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";
import {
	availableHeight,
	bandNow,
	bodyClip,
	bodyInset,
	bottomBand,
	clampHeight,
	closedHeight,
	contentArea,
	footerHeight,
	footerTop,
	indexForHeight,
	isLayoutReady,
	keyboardLift,
	positionFor,
	restingBottom,
	sheetState,
	surfaceHeight,
} from "../core";
import type { SheetGeometry, SheetSharedState } from "./state.types";
import { useDetents } from "./use-detents";

/**
 * Where an unmeasured panel goes: far enough down that no frame of it shows
 * before the container has reported a height.
 */
const OFFSCREEN = 100_000;

/**
 * Every derived number, as `useDerivedValue`s over the core's pure functions.
 *
 * Each hook is one formula from `core/AGENTS.md`, in dependency order, and none
 * of them writes anything: a gesture, an animation or a layout callback writes
 * the raw state and this re-derives. The keyboard values are real derivations
 * over `keyboardHeight` and `keyboardProgress`, which BSHEET-3 writes; until
 * then both are `0` and every keyboard term is inert.
 */
export function useSheetGeometry(state: SheetSharedState): SheetGeometry {
	const resting = useDerivedValue(() => {
		const detached = state.config.value.detached;
		return restingBottom(detached !== null, detached?.bottomOffset ?? 0, state.config.value.bottomInset);
	});
	const closed = useDerivedValue(() => closedHeight(resting.value));
	const maxHeight = useDerivedValue(() => availableHeight(state.containerHeight.value, resting.value));
	const band = useDerivedValue(() => bottomBand(state.config.value.detached !== null, state.config.value.bottomInset));
	const bandCurrent = useDerivedValue(() => bandNow(band.value, state.keyboardProgress.value));
	const detents = useDetents(state, maxHeight, band);
	const highest = useDerivedValue(() => {
		const list = detents.value;
		return list.length > 0 ? (list[list.length - 1] as number) : closed.value;
	});
	// The keyboard the sheet answers to: owned, and under a behaviour that does
	// anything about it. `none` neither lifts nor shrinks the body.
	const keyboardEffective = useDerivedValue(() =>
		state.keyboardOwned.value && state.config.value.keyboardBehavior !== "none" ? state.keyboardHeight.value : 0
	);
	const lift = useDerivedValue(() =>
		keyboardLift({
			keyboardHeight: keyboardEffective.value,
			progress: state.keyboardProgress.value,
			band: band.value,
			behavior: state.config.value.keyboardBehavior,
			gapBelow: resting.value,
		})
	);
	const height = useDerivedValue(() => clampHeight(state.base.value + lift.value, closed.value, maxHeight.value));
	const position = useDerivedValue(() => {
		const container = state.containerHeight.value;
		if (!(container > 0)) return OFFSCREEN;
		return positionFor(container, resting.value, height.value);
	});
	const index = useDerivedValue(() => indexForHeight(state.base.value, detents.value, closed.value));
	const sheetStateValue = useDerivedValue(() =>
		sheetState(state.base.value, height.value, detents.value, closed.value, maxHeight.value)
	);
	const layoutReady = useDerivedValue(() =>
		isLayoutReady({
			containerHeight: state.containerHeight.value,
			handleHeight: state.handleHeight.value,
			contentHeight: state.contentHeight.value,
			footerContentHeight: state.footerContentHeight.value,
			dynamicSizing: state.config.value.dynamicSizing,
			hasFooter: state.config.value.hasFooter,
		})
	);
	const footer = useDerivedValue(() =>
		footerHeight(state.config.value.hasFooter, state.footerContentHeight.value, bandCurrent.value)
	);
	// The body is sized against the highest detent rather than `base`, so it
	// never reflows during a snap between detents — but a `fillParent` snap
	// takes `base` above every detent, and the body follows it up.
	const area = useDerivedValue(() => {
		const sheetHeight = Math.min(maxHeight.value, Math.max(highest.value, state.base.value) + lift.value);
		return contentArea({
			sheetHeight,
			handleHeight: state.handleHeight.value,
			footerHeight: footer.value,
			keyboardHeight: keyboardEffective.value,
			trailingBand: state.config.value.hasFooter ? 0 : bandCurrent.value,
		});
	});
	const top = useDerivedValue(() =>
		footerTop({
			sheetHeight: height.value,
			keyboardHeight: keyboardEffective.value,
			footerContentHeight: state.footerContentHeight.value,
			band: bandCurrent.value,
		})
	);
	// The body is laid out to the sheet's bottom line and reserves `inset` at
	// its end; the clip is what of it may show — under a footer, only what is
	// above the footer's live top edge.
	const inset = useDerivedValue(() => bodyInset(state.config.value.hasFooter, footer.value, bandCurrent.value));
	const clip = useDerivedValue(() =>
		bodyClip({
			contentArea: area.value,
			inset: inset.value,
			hasFooter: state.config.value.hasFooter,
			sheetHeight: height.value,
			handleHeight: state.handleHeight.value,
			keyboardHeight: keyboardEffective.value,
		})
	);

	const surface = useDerivedValue(() => {
		if (state.config.value.detached === null) return height.value;
		const list = detents.value;
		const lowest = list.length > 0 ? (list[0] as number) : 0;
		return surfaceHeight(height.value, lowest, highest.value);
	});

	return useMemo<SheetGeometry>(
		() => ({
			restingBottom: resting,
			closedHeight: closed,
			maxHeight,
			band,
			bandNow: bandCurrent,
			detents,
			highest,
			keyboardLift: lift,
			height,
			position,
			index,
			sheetState: sheetStateValue,
			layoutReady,
			contentArea: area,
			footerHeight: footer,
			footerTop: top,
			bodyInset: inset,
			bodyClip: clip,
			surfaceHeight: surface,
		}),
		[
			resting,
			closed,
			maxHeight,
			band,
			bandCurrent,
			detents,
			highest,
			lift,
			height,
			position,
			index,
			sheetStateValue,
			layoutReady,
			area,
			footer,
			top,
			inset,
			clip,
			surface,
		]
	);
}
