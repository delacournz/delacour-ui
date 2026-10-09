import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { StackCardState } from "./stack-card.types";
import type { StackCardDirection, StackCardLayout, StackCardStampColor } from "./stack-card.variants";

export type StackCardContextValue = StackCardState & {
	/** The directions the gesture throws in. */
	directions: readonly StackCardDirection[];
	/** What a screen reader and an action button call each direction. */
	labelFor: (direction: StackCardDirection) => string;
	/** The colour of the stamp answering for each direction, which tints its action. */
	stampColors: Partial<Record<StackCardDirection, StackCardStampColor>>;
	isDisabled: boolean;
	layout: StackCardLayout;
	/** Cards drawn behind the top, already clamped to 0..4. */
	depth: number;
	/** Fraction of the card's size a drag must cover to throw it. */
	threshold: number;
	/** The OS reduce-motion setting: cards fade rather than fly. */
	isReducedMotion: boolean;
	/**
	 * The top card's offset, on the **UI thread** — the one value every part
	 * animates from. A drag writes it and nothing re-renders.
	 */
	x: SharedValue<number>;
	y: SharedValue<number>;
	/**
	 * The index of the top card on the UI thread. It moves the frame a throw
	 * lands, ahead of React, so the card behind is the top before anything
	 * re-renders.
	 */
	top: SharedValue<number>;
	/** The top card's opacity — what a reduced-motion throw fades. */
	fade: SharedValue<number>;
	/** The pile's measured size. `0` until it has been laid out. */
	width: SharedValue<number>;
	height: SharedValue<number>;
};

const StackCardContext = createContext<StackCardContextValue | null>(null);

/**
 * Supplies the deck's state to its parts.
 *
 * In a leaf of its own, importing nothing but types, so a part can read it
 * without importing `./stack-card` and closing a cycle (package AGENTS.md
 * rule 3).
 */
export function StackCardProvider({
	value,
	children,
}: {
	value: StackCardContextValue;
	children: ReactNode;
}): ReactElement {
	return <StackCardContext value={value}>{children}</StackCardContext>;
}
StackCardProvider.displayName = "DelacourUI.StackCard.Provider";

/** The enclosing deck, or null outside a `<StackCard>`. */
export function useStackCardContext(): StackCardContextValue | null {
	return use(StackCardContext);
}

/**
 * The enclosing deck's index, count and controls.
 *
 * For a custom control beside the pile — a counter, a "skip all" button. Throws
 * outside a `<StackCard>`.
 */
export function useStackCard(): StackCardState {
	const context = useStackCardContext();
	if (!context) {
		throw new Error("useStackCard must be called inside a <StackCard>.");
	}
	const { index, count, swipe, undo, canUndo } = context;
	return { canUndo, count, index, swipe, undo };
}

/**
 * The enclosing deck, for a part that cannot work without it.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useStackCardPart(component: string): StackCardContextValue {
	const context = useStackCardContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <StackCard>.`);
	}
	return context;
}

export type StackCardSlotContextValue = {
	/** This card's index in the deck. */
	cardIndex: number;
	/** Whether this card is the top one, as React last rendered it. */
	isTop: boolean;
};

const StackCardSlotContext = createContext<StackCardSlotContextValue | null>(null);

/** Tells a `StackCard.Card` which card it is. Internal. */
export function StackCardSlotProvider({
	value,
	children,
}: {
	value: StackCardSlotContextValue;
	children: ReactNode;
}): ReactElement {
	return <StackCardSlotContext value={value}>{children}</StackCardSlotContext>;
}
StackCardSlotProvider.displayName = "DelacourUI.StackCard.SlotProvider";

/** Which card this is, or null for a `StackCard.Card` rendered outside a deck's pile. */
export function useStackCardSlot(): StackCardSlotContextValue | null {
	return use(StackCardSlotContext);
}
