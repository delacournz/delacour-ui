import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { SlideButtonSize, SlideButtonVariant } from "./slide-button.variants";

export type SlideButtonContextValue = {
	variant: SlideButtonVariant;
	size: SlideButtonSize;
	/** Whether the slide has been confirmed, on the **JS thread** — what accessibility reads. */
	isCompleted: boolean;
	isDisabled: boolean;
	/** Whether the layout runs right to left, so the handle travels leftwards. */
	isRTL: boolean;
	/**
	 * How far the handle has travelled from its resting end, in points, on the
	 * **UI thread**. Always positive — the direction is applied where it is drawn.
	 */
	offset: SharedValue<number>;
	/** How far the handle can travel, in points. `0` until the rail has been measured. */
	travel: SharedValue<number>;
	/** The handle's width, from the rail's measured height. `0` until then. */
	handleWidth: SharedValue<number>;
	/** The chevron-to-tick crossing: `0` shows the chevron, `1` the tick. */
	glyph: SharedValue<number>;
};

const SlideButtonContext = createContext<SlideButtonContextValue | null>(null);

/**
 * Supplies one slide button's state and shared values to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./slide-button` — that import would close a cycle.
 */
export function SlideButtonProvider({
	value,
	children,
}: {
	value: SlideButtonContextValue;
	children: ReactNode;
}): ReactElement {
	return <SlideButtonContext value={value}>{children}</SlideButtonContext>;
}
SlideButtonProvider.displayName = "DelacourUI.SlideButton.Provider";

/** The enclosing slide button's state, or null outside a `<SlideButton>`. */
export function useSlideButtonContext(): SlideButtonContextValue | null {
	return use(SlideButtonContext);
}

/**
 * Reads the enclosing slide button's state.
 *
 * Lets a custom handle or label match the control — read `offset` against
 * `travel` to draw anything that follows the drag. Throws outside a
 * `<SlideButton>`; use {@link useSlideButtonContext} where it is optional.
 */
export function useSlideButton(): SlideButtonContextValue {
	const context = useSlideButtonContext();
	if (!context) {
		throw new Error("useSlideButton must be called inside a <SlideButton>.");
	}
	return context;
}

/**
 * The enclosing slide button's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useSlideButtonPart(component: string): SlideButtonContextValue {
	const context = useSlideButtonContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SlideButton>.`);
	}
	return context;
}
