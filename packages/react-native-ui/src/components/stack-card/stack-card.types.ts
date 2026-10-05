import type { StackCardDirection } from "./stack-card.variants";

/**
 * What a `ref` on `StackCard` reaches, and what `useStackCard()` hands a custom
 * control: throw the top card, or bring the last one back.
 */
export type StackCardHandle = {
	/**
	 * Throws the top card `direction`, exactly as a release would — `onSwipe`,
	 * then `onIndexChange`. Any direction works, allowed for the gesture or not,
	 * because a button is an explicit answer.
	 */
	swipe: (direction: StackCardDirection) => void;
	/** Brings the last thrown card back from the side it left. `onSwipe` is not called. */
	undo: () => void;
};

/** The deck's state, as `useStackCard()` returns it. */
export type StackCardState = StackCardHandle & {
	/** The index of the top card. Equal to `count` once the deck is empty. */
	index: number;
	/** How many cards the deck holds. */
	count: number;
	/** Whether there is a thrown card to bring back. */
	canUndo: boolean;
};
