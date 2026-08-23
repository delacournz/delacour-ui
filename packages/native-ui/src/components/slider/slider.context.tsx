import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable";
import type { SliderRenderProps } from "./slider.types";
import type { SliderColor, SliderOrientation, SliderSize } from "./slider.variants";

export type SliderContextValue = {
	/**
	 * Every thumb's value, snapped, on the **JS thread**.
	 *
	 * What `Slider.Output` and the accessibility props read. The live position a
	 * finger is dragging lives in {@link SliderContextValue.positions} instead —
	 * these two agree at rest and lag by a mirror hop during a drag, which is the
	 * whole reason the drag never waits on React.
	 */
	values: number[];
	minValue: number;
	maxValue: number;
	/** The increment the values snap to. `0` is continuous. */
	step: number;
	orientation: SliderOrientation;
	color: SliderColor;
	size: SliderSize;
	isDisabled: boolean;
	isInvalid: boolean;
	/** Passed to `Intl.NumberFormat` by `Slider.Output`. */
	formatOptions?: Intl.NumberFormatOptions;
	/** Played as the value crosses a step. `false` silences it. */
	haptic: false | HapticFeedback;
	/**
	 * Every thumb's live value, on the **UI thread**.
	 *
	 * One shared value holding the whole array rather than one per thumb, because
	 * a thumb count is data and hooks cannot be called in a loop. Reassign it —
	 * `positions.value = next` — and never write an element in place: an array
	 * element has no setter behind it, so `positions.value[0] = x` updates nothing
	 * and fails silently.
	 */
	positions: SharedValue<number[]>;
	/** The track's own length, from its `onLayout`. `0` until it has been measured. */
	trackSize: SharedValue<number>;
	/** A thumb's diameter, from its `onLayout`. `0` until it has been measured. */
	thumbSize: SharedValue<number>;
	/** Which thumb is being dragged, or `-1` when none is. */
	activeIndex: SharedValue<number>;
	/**
	 * Writes one thumb's value from the **JS thread**, snapping and clamping it
	 * first.
	 *
	 * The one path into the value that does not go through the pan — an
	 * accessibility increment has no gesture behind it.
	 */
	updateValue: (index: number, next: number) => void;
	/**
	 * Tells the root a drag has started or finished.
	 *
	 * The root stops syncing the shared value from React state while this is true.
	 * Without it the mirror hop back from the UI thread would round-trip through a
	 * render and land on the thumb a frame late, dragging it backwards on every
	 * commit — a jitter that only shows up on a fast drag.
	 */
	setDragging: (dragging: boolean) => void;
	/** Reports a drag's new values. Called from the pan's mirror, never in render. */
	commitValues: (next: number[]) => void;
	/** Reports the values a drag settled on, once, on release. */
	commitEnd: (next: number[]) => void;
	/** The settled state a render function is handed. */
	renderProps: SliderRenderProps;
};

const SliderContext = createContext<SliderContextValue | null>(null);

/**
 * Supplies one slider's settled state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./slider`. That import would close a cycle, and Metro
 * serves a partially initialised module for a cycle — leaving the context
 * `undefined` at import time and red-boxing the app on a cold start.
 */
export function SliderProvider({ value, children }: { value: SliderContextValue; children: ReactNode }): ReactElement {
	return <SliderContext value={value}>{children}</SliderContext>;
}
SliderProvider.displayName = "DelacourUI.Slider.Provider";

/** The enclosing slider's state, or null outside a `<Slider>`. */
export function useSliderContext(): SliderContextValue | null {
	return use(SliderContext);
}

/**
 * Reads the enclosing slider's settled state.
 *
 * For a custom readout or a custom thumb that has to match the slider it sits in.
 * Throws outside one — use {@link useSliderContext} where the slider is optional.
 */
export function useSlider(): SliderContextValue {
	const context = useSliderContext();
	if (!context) {
		throw new Error("useSlider must be called inside a <Slider>.");
	}
	return context;
}

/**
 * The enclosing slider's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useSlider}, whose error message names the hook rather than
 * a part.
 */
export function useSliderPart(component: string): SliderContextValue {
	const context = useSliderContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Slider>.`);
	}
	return context;
}
