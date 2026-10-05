import type { TagInputBlurBehavior, TagInputRejection, TagInputRejectReason } from "./tag-input.types";

/**
 * The pure half of `TagInput`: parsing typed and pasted text into tags, the
 * rules a tag has to pass, and the two-press Backspace.
 *
 * Free of React and React Native imports so every decision here is reachable
 * from `bun test` — the component only wires these to events. See AGENTS.md.
 */

/** The rules a single tag is checked against. */
export type TagInputAddOptions = {
	max?: number;
	allowOverflow?: boolean;
	allowDuplicates?: boolean;
	caseSensitiveDuplicates?: boolean;
	validate?: (tag: string, current: readonly string[]) => boolean;
};

/** The rules, plus how raw text becomes tags. */
export type TagInputCommitOptions = TagInputAddOptions & {
	/** Single characters that commit. Longer strings are ignored. */
	delimiters: readonly string[];
	transform?: (raw: string) => string;
};

export type TagInputAddResult = { ok: true; tags: string[] } | { ok: false; reason: TagInputRejectReason };

/** What a commit did: the list after it, what was accepted and refused, and the text left in the field. */
export type TagInputCommitResult = {
	tags: string[];
	accepted: string[];
	rejected: TagInputRejection[];
	draft: string;
};

/**
 * Splits on any delimiter. A newline always splits too: a one-line field cannot
 * hold one, so a newline can only have arrived in a paste, where it separates
 * values just as a comma does.
 */
function splitPattern(delimiters: readonly string[]): RegExp {
	const chars = ["\n", ...delimiters.filter((delimiter) => delimiter.length === 1)];
	const escaped = [...new Set(chars)].map((char) => char.replace(/[\\\]^-]/g, "\\$&"));
	return new RegExp(`[${escaped.join("")}]`);
}

/**
 * Cuts text at its delimiters. Every piece before the last delimiter is
 * complete and comes back trimmed, empties dropped — so a run of spaces, or a
 * leading comma, commits nothing. What follows the last delimiter is still
 * being typed and comes back verbatim as `remainder`.
 *
 * Delimiters are single characters; anything longer is ignored rather than
 * half-matched.
 */
export function splitByDelimiters(
	text: string,
	delimiters: readonly string[]
): { pieces: string[]; remainder: string } {
	const parts = text.split(splitPattern(delimiters));
	const remainder = parts.pop() ?? "";
	const pieces = parts.map((part) => part.trim()).filter((part) => part.length > 0);
	return { pieces, remainder };
}

/** Trims a tag, then applies the caller's `transform`. Inner whitespace is left as typed. */
export function normalizeTag(raw: string, transform?: (raw: string) => string): string {
	const trimmed = raw.trim();
	return transform ? transform(trimmed) : trimmed;
}

/**
 * Checks one normalised tag against the list it would join.
 *
 * The order is pinned by a test — empty, duplicate, invalid, max — so the reason
 * reported is the most specific one: a duplicate typed into a full list says
 * "already there" rather than "full", which is the one the user can act on.
 */
export function evaluateAdd(tag: string, current: readonly string[], options: TagInputAddOptions): TagInputAddResult {
	if (tag.length === 0) return { ok: false, reason: "empty" };

	if (!options.allowDuplicates) {
		const key = options.caseSensitiveDuplicates ? tag : tag.toLowerCase();
		const exists = current.some((item) => (options.caseSensitiveDuplicates ? item : item.toLowerCase()) === key);
		if (exists) return { ok: false, reason: "duplicate" };
	}

	if (options.validate && !options.validate(tag, current)) return { ok: false, reason: "invalid" };

	if (options.max !== undefined && !options.allowOverflow && current.length >= options.max) {
		return { ok: false, reason: "max" };
	}

	return { ok: true, tags: [...current, tag] };
}

/** How kept pieces are put back together: `", "` for a comma, one space for a space. */
function joinerFor(delimiters: readonly string[]): string {
	const first = delimiters.find((delimiter) => delimiter.length === 1) ?? ",";
	return first === " " ? " " : `${first} `;
}

/**
 * Runs each piece through {@link evaluateAdd} in order, against the list as it
 * grows — so two copies inside one paste are caught, and `max` is counted as
 * the paste lands. One refusal never drops the pieces around it.
 *
 * A piece refused as `invalid` goes back into the field, because it is the one
 * refusal the user can fix by editing. A duplicate, an empty or an over-limit
 * piece has nothing to fix, so it is dropped.
 */
function commitPieces(
	pieces: readonly string[],
	current: readonly string[],
	options: TagInputCommitOptions
): Omit<TagInputCommitResult, "draft"> & { kept: string[] } {
	let tags = [...current];
	const accepted: string[] = [];
	const rejected: TagInputRejection[] = [];
	const kept: string[] = [];

	for (const piece of pieces) {
		const tag = normalizeTag(piece, options.transform);
		const result = evaluateAdd(tag, tags, options);
		if (result.ok) {
			tags = result.tags;
			accepted.push(tag);
			continue;
		}
		rejected.push({ reason: result.reason, tag });
		if (result.reason === "invalid") kept.push(piece.trim());
	}

	return { accepted, kept, rejected, tags };
}

/**
 * Commits everything in the field — what Return, a blur with `add`, and the
 * handle's `add()` do. The remainder after the last delimiter is committed too.
 *
 * Text that is only whitespace is reported as one `empty` rejection, so Return
 * on an empty field can say so.
 */
export function commitDraft(
	draft: string,
	current: readonly string[],
	options: TagInputCommitOptions
): TagInputCommitResult {
	if (draft.trim().length === 0) {
		return { accepted: [], draft: "", rejected: [{ reason: "empty", tag: "" }], tags: [...current] };
	}

	const { pieces, remainder } = splitByDelimiters(draft, options.delimiters);
	const all = remainder.trim().length > 0 ? [...pieces, remainder] : pieces;
	const { kept, ...result } = commitPieces(all, current, options);
	return { ...result, draft: kept.join(joinerFor(options.delimiters)) };
}

/**
 * Handles the field's text as it changes. With no delimiter in it the text is
 * simply the new draft. Otherwise every complete piece is committed and the
 * tail stays in the field — so typing a comma commits a tag, and pasting
 * `a,b,c` commits two and leaves `c` being typed.
 */
export function ingestText(
	text: string,
	current: readonly string[],
	options: TagInputCommitOptions
): TagInputCommitResult {
	const { pieces, remainder } = splitByDelimiters(text, options.delimiters);
	if (pieces.length === 0 && remainder === text) {
		return { accepted: [], draft: text, rejected: [], tags: [...current] };
	}

	const { kept, ...result } = commitPieces(pieces, current, options);
	const tail = remainder.trimStart();
	const joiner = joinerFor(options.delimiters);
	const draft = kept.length > 0 ? [...kept, tail].filter((part) => part.length > 0).join(joiner) : tail;
	return { ...result, draft };
}

export type TagInputBackspaceAction =
	| { type: "none" }
	| { type: "arm"; index: number }
	| { type: "remove"; index: number };

/**
 * What Backspace does. While there is text it is just editing. On an empty
 * field the first press arms the last tag — it turns destructive — and the
 * second removes it, so one stray press never deletes a tag outright.
 *
 * Disarming is the caller's: any text change, blur or removal clears it.
 */
export function resolveBackspace({
	draft,
	tagCount,
	isArmed,
}: {
	draft: string;
	tagCount: number;
	isArmed: boolean;
}): TagInputBackspaceAction {
	if (draft.length > 0 || tagCount === 0) return { type: "none" };
	const index = tagCount - 1;
	return isArmed ? { index, type: "remove" } : { index, type: "arm" };
}

/**
 * What leaving the field does with the text left in it. An empty draft never
 * commits, so tabbing away from an empty field does not report `empty`.
 */
export function resolveBlur(behavior: TagInputBlurBehavior, draft: string): "commit" | "clear" | "none" {
	if (behavior === "add") return draft.trim().length > 0 ? "commit" : "none";
	if (behavior === "clear") return draft.length > 0 ? "clear" : "none";
	return "none";
}

/** Past `max`, not at it. The field turns invalid when this holds. */
export function isOverflowing({ count, max }: { count: number; max?: number }): boolean {
	return max !== undefined && count > max;
}

/** `3/10` with a limit, `3` without. */
export function resolveCounterText(count: number, max?: number): string {
	return max === undefined ? `${count}` : `${count}/${max}`;
}

/**
 * Whether the text field is left out of the box.
 *
 * Read-only always; full, unless overflow is allowed — there is nothing it
 * could add. Disabled once there are tags, so the box shows the tags alone; with
 * none, the field stays to show its faded placeholder.
 */
export function shouldHideInput({
	count,
	max,
	allowOverflow,
	isReadOnly,
	isDisabled,
}: {
	count: number;
	max?: number;
	allowOverflow: boolean;
	isReadOnly: boolean;
	isDisabled: boolean;
}): boolean {
	if (isReadOnly) return true;
	if (max !== undefined && !allowOverflow && count >= max) return true;
	return isDisabled && count > 0;
}

/** The shortest gap between two rejection haptics. A paste refused ten times buzzes once. */
export const REJECT_HAPTIC_INTERVAL_MS = 400;

/** Whether a rejection haptic may fire now, given when the last one did. */
export function shouldFireRejectHaptic(lastAt: number | null, now: number): boolean {
	return lastAt === null || now - lastAt >= REJECT_HAPTIC_INTERVAL_MS;
}

/** What a screen reader hears when a tag is refused, by reason. Override per reason with `rejectMessages`. */
export const DEFAULT_REJECT_MESSAGES: Record<TagInputRejectReason, string> = {
	duplicate: "Duplicate, not added",
	empty: "Nothing to add",
	invalid: "Not valid, not added",
	max: "Limit reached, not added",
};

export function resolveAddAnnouncement(tag: string): string {
	return `Added ${tag}`;
}

export function resolveRemoveAnnouncement(tag: string): string {
	return `Removed ${tag}`;
}

export function resolveRejectAnnouncement(
	reason: TagInputRejectReason,
	overrides?: Partial<Record<TagInputRejectReason, string>>
): string {
	return overrides?.[reason] ?? DEFAULT_REJECT_MESSAGES[reason];
}

/** The tag group's accessible name. */
export function resolveTagsAccessibilityLabel(count: number): string {
	if (count === 0) return "No tags";
	return count === 1 ? "1 tag" : `${count} tags`;
}
