import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { FlipCardAxis, FlipCardFace, FlipCardTrigger } from "./flip-card.variants";

/** What `useFlipCard()` hands a custom child: the face, the two ways to turn it, and whether it is turning. */
export type FlipCardState = {
	/** The face the card is showing, or turning to. Changes the moment a turn is committed. */
	face: FlipCardFace;
	/** Turns to the other face. */
	flip: () => void;
	/** Turns to a named face; a no-op if it is already showing. */
	flipTo: (face: FlipCardFace) => void;
	/** True from the commit of a turn until the card settles. */
	isFlipping: boolean;
};

export type FlipCardContextValue = FlipCardState & {
	axis: FlipCardAxis;
	trigger: FlipCardTrigger;
	isDisabled: boolean;
	/** Reduce motion or an E2E build: the faces crossfade and nothing turns. */
	isCalm: boolean;
	perspective: number;
	/** Degrees, 0 = front, 180 = back. Written on the UI thread; never read in render. */
	rotation: SharedValue<number>;
	/** The card's name, for the visible face when that face is one accessibility element. */
	accessibilityLabel?: string;
};

const FlipCardContext = createContext<FlipCardContextValue | null>(null);

/**
 * Supplies the card's face, rotation and turn functions to its parts.
 *
 * Lives in its own module, importing nothing but types, so a part can read it
 * without importing `./flip-card` and closing a cycle. See AGENTS.md rule 3.
 */
export function FlipCardProvider({
	value,
	children,
}: {
	value: FlipCardContextValue;
	children: ReactNode;
}): ReactElement {
	return <FlipCardContext value={value}>{children}</FlipCardContext>;
}
FlipCardProvider.displayName = "DelacourUI.FlipCard.Provider";

/** The enclosing card's context, or null outside a `<FlipCard>`. */
export function useFlipCardContext(): FlipCardContextValue | null {
	return use(FlipCardContext);
}

/**
 * Reads the enclosing card's face and turns it.
 *
 * Lets any child — a "Show answer" button, a label that reads the face — turn
 * the card or follow it without the card passing props down. Throws outside a
 * `<FlipCard>`.
 */
export function useFlipCard(): FlipCardState {
	const context = useFlipCardContext();
	if (!context) {
		throw new Error("useFlipCard must be called inside a <FlipCard>.");
	}
	return { face: context.face, flip: context.flip, flipTo: context.flipTo, isFlipping: context.isFlipping };
}

/**
 * The enclosing card's context, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller outside the library wants
 * {@link useFlipCard}, whose error names the hook rather than a part.
 */
export function useFlipCardPart(component: string): FlipCardContextValue {
	const context = useFlipCardContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <FlipCard>.`);
	}
	return context;
}
