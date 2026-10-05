import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ChipVariant } from "../chip/chip.variants";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { TagInputRejectReason } from "./tag-input.types";

export type TagInputContextValue = {
	/** The tags, in order. */
	tags: readonly string[];
	/** The text still being typed. */
	draft: string;
	/** Whether the text field holds focus. */
	isFocused: boolean;
	/** The tag a first Backspace armed, which a second removes — always the last, or `null`. */
	pendingRemoveIndex: number | null;
	size: InputSize;
	variant: InputVariant;
	chipVariant: ChipVariant;
	isDisabled: boolean;
	isReadOnly: boolean;
	/** Invalid from the prop, the enclosing `Field`, or overflowing `max`. */
	isInvalid: boolean;
	/** Past `max` — only possible with `allowOverflow`, or a controlled list that already is. */
	isOverflowing: boolean;
	max: number | undefined;
	/** Commits `raw` as though typed and confirmed. Returns the first rejection's reason, or `null`. */
	add: (raw: string) => TagInputRejectReason | null;
	/** Removes the tag at `index`. A no-op while disabled or read-only. */
	remove: (index: number) => void;
	/** Removes every tag and empties the draft. */
	clear: () => void;
	/** The accessible name of one tag's remove control. */
	removeAccessibilityLabel: (tag: string) => string;
	/** The root's `testID`, from which each part derives its own. */
	testID: string | undefined;
};

const TagInputContext = createContext<TagInputContextValue | null>(null);

/**
 * Supplies a tag input's tags, draft and state to its subtree.
 *
 * Lives in its own module, importing nothing but React and types, so the chip
 * and suffix parts can read it without importing `./tag-input` and closing a
 * cycle back through the root. See AGENTS.md rule 3.
 */
export function TagInputProvider({
	value,
	children,
}: {
	value: TagInputContextValue;
	children: ReactNode;
}): ReactElement {
	return <TagInputContext value={value}>{children}</TagInputContext>;
}
TagInputProvider.displayName = "DelacourUI.TagInput.Provider";

/** The enclosing tag input's context, or null outside one. */
export function useTagInputContext(): TagInputContextValue | null {
	return use(TagInputContext);
}

/**
 * Reads the enclosing `TagInput`'s tags, draft and state, and its `add` and
 * `remove` — for a `renderTag` that needs more than the tag it was handed.
 * Throws outside one.
 */
export function useTagInput(): TagInputContextValue {
	const context = useTagInputContext();
	if (!context) {
		throw new Error("useTagInput must be called inside a <TagInput>.");
	}
	return context;
}

/**
 * The enclosing tag input's context, for an internal part that cannot work
 * without one. Not re-exported from `index.ts`.
 */
export function useTagInputPart(component: string): TagInputContextValue {
	const context = useTagInputContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <TagInput>.`);
	}
	return context;
}
