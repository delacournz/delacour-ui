import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { HapticFeedback } from "../pressable";
import type { RatingColor, RatingSize } from "./rating.variants";

/** What a render function inside a rating is handed. */
export type RatingRenderProps = {
	/** The value, clamped to the count but not snapped — a read-only 3.7 stays 3.7. */
	value: number;
	/** How many stars the row draws. */
	count: number;
	/** The increment a touch snaps to. */
	step: number;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
};

export type RatingContextValue = RatingRenderProps & {
	color: RatingColor;
	size: RatingSize;
	/** A tap on the value already held clears it back to zero. */
	allowClear: boolean;
	/** Played on grab, on every star crossed and on a clear. `false` silences it. */
	haptic: false | HapticFeedback;
	/**
	 * Writes a new value from the **JS thread**. Called from the gesture's mirror,
	 * from an assistive action and from a clear — never in render.
	 */
	setValue: (next: number) => void;
	/** Reports the value a gesture or an assistive action settled on, once. */
	commitEnd: (next: number) => void;
	/** The settled state a render function is handed. */
	renderProps: RatingRenderProps;
};

const RatingContext = createContext<RatingContextValue | null>(null);

/**
 * Supplies one rating's settled state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./rating` and closing a cycle (AGENTS.md rule 3).
 */
export function RatingProvider({ value, children }: { value: RatingContextValue; children: ReactNode }): ReactElement {
	return <RatingContext value={value}>{children}</RatingContext>;
}
RatingProvider.displayName = "DelacourUI.Rating.Provider";

/** The enclosing rating's state, or null outside a `<Rating>`. */
export function useRatingContext(): RatingContextValue | null {
	return use(RatingContext);
}

/**
 * Reads the enclosing rating's settled state.
 *
 * For a custom readout that has to match the rating it sits beside. Throws
 * outside one — use {@link useRatingContext} where the rating is optional.
 */
export function useRating(): RatingContextValue {
	const context = useRatingContext();
	if (!context) {
		throw new Error("useRating must be called inside a <Rating>.");
	}
	return context;
}

/**
 * The enclosing rating's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useRatingPart(component: string): RatingContextValue {
	const context = useRatingContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Rating>.`);
	}
	return context;
}
