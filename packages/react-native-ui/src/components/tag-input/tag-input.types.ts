/**
 * Why a tag was not added.
 *
 * - `empty` — nothing but whitespace was committed.
 * - `duplicate` — the tag is already in the list (case-insensitive by default).
 * - `invalid` — the caller's `validate` returned `false`.
 * - `max` — the list is full and overflow is not allowed.
 */
export type TagInputRejectReason = "duplicate" | "max" | "invalid" | "empty";

/**
 * What leaving the field does to the text still in it.
 *
 * - `add` — commits it, as Return would.
 * - `clear` — throws it away.
 * - `keep` — leaves it for when the field is focused again.
 */
export type TagInputBlurBehavior = "add" | "clear" | "keep";

/** One rejected tag and the reason, as `onReject` receives it. */
export type TagInputRejection = { tag: string; reason: TagInputRejectReason };

/** What a ref to a `TagInput` can do. */
export type TagInputHandle = {
	/** Focuses the text field. Does nothing while it is hidden — read-only, disabled with tags, or full. */
	focus(): void;
	blur(): void;
	/** Removes every tag and empties the draft. */
	clear(): void;
	/**
	 * Commits `raw` as though it had been typed and confirmed — split on the
	 * delimiters, trimmed and transformed. Returns the first rejection's
	 * reason, or `null` when every piece was added.
	 */
	add(raw: string): TagInputRejectReason | null;
};

/** What `renderTag` is handed beside the tag's text. */
export type TagInputTagState = {
	index: number;
	/** The last tag, armed by a first Backspace and removed by a second. */
	isPendingRemove: boolean;
	/** Whether the tag can be removed — false while disabled or read-only. */
	isRemovable: boolean;
	/** Removes this tag. A no-op when it is not removable. */
	remove: () => void;
};
