import { MARKDOWN_FENCE_CLOSE, MARKDOWN_FENCE_OPEN } from "./markdown-editor.parse";
import type {
	MarkdownCommand,
	MarkdownCommandType,
	MarkdownEdit,
	MarkdownHeadingLevel,
	MarkdownSelection,
} from "./markdown-editor.types";

/*
 * Every command is a list of splices against the original text, applied in
 * one pass. Positions — the selection's two ends — are carried through the
 * same list by `mapPosition`, so no command has to work out by hand how far
 * an earlier insertion pushed its caret.
 */

/** Replace `remove` characters at `at` with `insert`. Offsets are into the original text. */
type Splice = { at: number; remove: number; insert: string };

/** Which way a position leans when text is inserted exactly where it sits. */
type Bias = "before" | "after";

function sortSplices(splices: readonly Splice[]): Splice[] {
	const merged = new Map<number, Splice>();
	for (const splice of splices) {
		const existing = merged.get(splice.at);
		merged.set(
			splice.at,
			existing
				? { at: splice.at, insert: existing.insert + splice.insert, remove: existing.remove + splice.remove }
				: splice
		);
	}
	return [...merged.values()].sort((a, b) => a.at - b.at);
}

function applySplices(text: string, splices: readonly Splice[]): string {
	let out = "";
	let cursor = 0;
	for (const splice of splices) {
		out += text.slice(cursor, splice.at) + splice.insert;
		cursor = splice.at + splice.remove;
	}
	return out + text.slice(cursor);
}

/**
 * Where a position in the original text lands after the splices.
 *
 * A position inside removed text collapses to where that text was. A position
 * exactly at an insertion goes before it or after it as `bias` says: a
 * selection's start leans after an opening marker and its end before the
 * closing one, which is what keeps a wrapped word selected rather than its
 * markers.
 */
function mapPosition(position: number, splices: readonly Splice[], bias: Bias): number {
	let delta = 0;
	for (const splice of splices) {
		if (splice.at > position) break;
		const end = splice.at + splice.remove;
		if (splice.at === position) {
			if (splice.remove === 0) {
				if (bias === "after") delta += splice.insert.length;
				continue;
			}
			return position + delta + (bias === "after" ? splice.insert.length : 0);
		}
		if (end <= position) {
			delta += splice.insert.length - splice.remove;
			continue;
		}
		return splice.at + delta + (bias === "after" ? splice.insert.length : 0);
	}
	return position + delta;
}

/** Maps a position in the original text into the edited one. */
type MapPosition = (position: number, bias: Bias) => number;

function edit(
	text: string,
	splices: readonly Splice[],
	selection: (map: MapPosition) => MarkdownSelection
): MarkdownEdit {
	const sorted = sortSplices(splices);
	const next = applySplices(text, sorted);
	const raw = selection((position, bias) => mapPosition(position, sorted, bias));
	return { selection: normalizeMarkdownSelection(next, raw), text: next };
}

type Line = { index: number; start: number; end: number; text: string };

function splitLines(text: string): Line[] {
	const lines: Line[] = [];
	let start = 0;
	let index = 0;
	for (;;) {
		const newline = text.indexOf("\n", start);
		const end = newline === -1 ? text.length : newline;
		lines.push({ end, index, start, text: text.slice(start, end) });
		if (newline === -1) return lines;
		start = newline + 1;
		index++;
	}
}

function lineAt(lines: readonly Line[], position: number): Line {
	let low = 0;
	let high = lines.length - 1;
	while (low < high) {
		const mid = (low + high + 1) >>> 1;
		if ((lines[mid]?.start ?? 0) <= position) low = mid;
		else high = mid - 1;
	}
	return lines[low] as Line;
}

/** The lines a selection touches. A range ending at the very start of a line does not touch it. */
function touchedLines(lines: readonly Line[], selection: MarkdownSelection): Line[] {
	const first = lineAt(lines, selection.start);
	let last = lineAt(lines, selection.end);
	if (selection.end > selection.start && last.index > first.index && selection.end === last.start) {
		last = lines[last.index - 1] as Line;
	}
	return lines.slice(first.index, last.index + 1);
}

function isHighSurrogate(code: number): boolean {
	return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
	return code >= 0xdc00 && code <= 0xdfff;
}

/** Whether `position` falls between the two halves of a surrogate pair. */
function splitsPair(text: string, position: number): boolean {
	return (
		position > 0 &&
		position < text.length &&
		isLowSurrogate(text.charCodeAt(position)) &&
		isHighSurrogate(text.charCodeAt(position - 1))
	);
}

/**
 * Puts a selection in order and inside the text.
 *
 * Swaps a reversed range, clamps both ends to `0…length`, and widens any end
 * that falls between the halves of a surrogate pair so an emoji is never cut
 * in two — outward for a range, backward for a caret.
 */
export function normalizeMarkdownSelection(text: string, selection: MarkdownSelection): MarkdownSelection {
	const clamp = (value: number): number =>
		Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), text.length) : 0;
	const start = clamp(Math.min(selection.start, selection.end));
	const end = clamp(Math.max(selection.start, selection.end));
	if (start === end) {
		const caret = splitsPair(text, start) ? start - 1 : start;
		return { end: caret, start: caret };
	}
	return { end: splitsPair(text, end) ? end + 1 : end, start: splitsPair(text, start) ? start - 1 : start };
}

/* ─── Inline marks ─────────────────────────────────────────────────────────── */

const WORD = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s/;

type InlineMarker = "**" | "_" | "`" | "~~";

const INLINE_MARKERS: Record<"bold" | "italic" | "code" | "strikethrough", InlineMarker> = {
	bold: "**",
	code: "`",
	italic: "_",
	strikethrough: "~~",
};

/** A pair of markers on one line: the opener starts at `open`, the closer at `close`. */
type Run = { open: number; close: number; size: number };

function isBlank(char: string | undefined): boolean {
	return char === undefined || WHITESPACE.test(char);
}

function isWord(char: string | undefined): boolean {
	return char !== undefined && WORD.test(char);
}

/**
 * The pairs of `marker` on one line, as absolute offsets.
 *
 * Pairs left to right, the way the parser reads them: an opener may not be
 * followed by whitespace and a closer may not follow it, except that an empty
 * pair — the one a caret insert leaves — is still a pair. `_` additionally
 * refuses to open after, or close before, a letter or digit, so the
 * underscores in `snake_case_name` are never a mark.
 */
function findRuns(text: string, line: Line, marker: InlineMarker): Run[] {
	const runs: Run[] = [];
	const size = marker.length;
	const intraword = marker === "_";
	let open: number | null = null;
	let i = line.start;

	while (i < line.end) {
		if (text[i] === "\\") {
			i += 2;
			continue;
		}
		if (!text.startsWith(marker, i) || i + size > line.end) {
			i++;
			continue;
		}
		const before = i > line.start ? text[i - 1] : undefined;
		const after = i + size < line.end ? text[i + size] : undefined;
		const canOpen = !isBlank(after) && !(intraword && isWord(before));
		const canClose = open !== null && (i === open + size || !isBlank(before)) && !(intraword && isWord(after));
		if (open !== null && canClose) {
			runs.push({ close: i, open, size });
			open = null;
		} else if (canOpen) {
			open = i;
		}
		i += size;
	}

	return runs;
}

/** The run a range sits inside — between its markers, or covering them exactly. */
function enclosingRun(runs: readonly Run[], start: number, end: number): Run | undefined {
	return runs.find((run) => {
		const inner = start >= run.open + run.size && end <= run.close;
		const outer = start >= run.open && end <= run.close + run.size;
		return inner || (start !== end && outer);
	});
}

function removeRun(run: Run): Splice[] {
	return [
		{ at: run.open, insert: "", remove: run.size },
		{ at: run.close, insert: "", remove: run.size },
	];
}

type Segment = { line: Line; start: number; end: number };

function trimSegment(text: string, segment: Segment): Segment {
	let { start, end } = segment;
	while (start < end && isBlank(text[start])) start++;
	while (end > start && isBlank(text[end - 1])) end--;
	return { end, line: segment.line, start };
}

/**
 * Bold, italic, inline code or strikethrough.
 *
 * A caret inserts an empty pair and sits between, or — inside a run already —
 * removes that run. A range is trimmed of edge whitespace and split per line,
 * because a marker may never span a line break; when every line is already
 * wrapped the marks come off, otherwise each line that is not gets wrapped. A
 * run the range only partly overlaps is widened to the union rather than left
 * interleaved, which is what makes a second tap a clean undo.
 */
function toggleInline(text: string, selection: MarkdownSelection, marker: InlineMarker): MarkdownEdit {
	const lines = splitLines(text);
	const { start, end } = selection;

	if (start === end) {
		const line = lineAt(lines, start);
		const run = enclosingRun(findRuns(text, line, marker), start, end);
		if (run) {
			return edit(text, removeRun(run), (map) => ({
				end: map(start, "before"),
				start: map(start, "before"),
			}));
		}
		return edit(text, [{ at: start, insert: marker + marker, remove: 0 }], (map) => {
			const caret = map(start, "before") + marker.length;
			return { end: caret, start: caret };
		});
	}

	const segments = touchedLines(lines, selection)
		.map((line) => trimSegment(text, { end: Math.min(end, line.end), line, start: Math.max(start, line.start) }))
		.filter((segment) => segment.end > segment.start);

	const [first] = segments;
	const last = segments[segments.length - 1];
	if (!first || !last) return { selection, text };

	const resolved = segments.map((segment) => {
		const runs = findRuns(text, segment.line, marker);
		return { enclosing: enclosingRun(runs, segment.start, segment.end), runs, segment };
	});

	if (resolved.every((entry) => entry.enclosing)) {
		const splices = resolved.flatMap((entry) => (entry.enclosing ? removeRun(entry.enclosing) : []));
		return edit(text, splices, (map) => ({ end: map(end, "before"), start: map(start, "after") }));
	}

	const splices: Splice[] = [];
	const bounds = resolved.map(({ enclosing, runs, segment }) => {
		if (enclosing) return { end: segment.end, start: segment.start };
		const overlapping = runs.filter((run) => run.open < segment.end && run.close + run.size > segment.start);
		const from = Math.min(segment.start, ...overlapping.map((run) => run.open));
		const to = Math.max(segment.end, ...overlapping.map((run) => run.close + run.size));
		for (const run of overlapping) splices.push(...removeRun(run));
		splices.push({ at: from, insert: marker, remove: 0 }, { at: to, insert: marker, remove: 0 });
		return { end: to, start: from };
	});

	const firstBounds = bounds[0] ?? first;
	const lastBounds = bounds[bounds.length - 1] ?? last;
	return edit(text, splices, (map) => ({
		end: map(lastBounds.end, "before"),
		start: map(firstBounds.start, "after"),
	}));
}

/* ─── Links ────────────────────────────────────────────────────────────────── */

const LINK = /\[([^\]\n]*)\]\(([^)\s]*)\)/g;
const URL_LIKE = /^(?:https?:\/\/|mailto:|tel:)\S+$/i;
const LINK_PLACEHOLDER = "url";
const LABEL_PLACEHOLDER = "link";

type LinkMatch = { start: number; end: number; labelEnd: number };

function findLinks(line: Line): LinkMatch[] {
	const links: LinkMatch[] = [];
	for (const match of line.text.matchAll(LINK)) {
		const start = line.start + (match.index ?? 0);
		links.push({ end: start + match[0].length, labelEnd: start + 1 + (match[1]?.length ?? 0), start });
	}
	return links;
}

function enclosingLink(links: readonly LinkMatch[], start: number, end: number): LinkMatch | undefined {
	return links.find((link) =>
		start === end ? start > link.start && start < link.end : start >= link.start && end <= link.end
	);
}

/**
 * A link.
 *
 * Inside one already, it comes off and leaves its label. A selected url
 * becomes the url of a link whose label is selected for typing; any other
 * selection becomes the label, with the url — the command's, or a `url`
 * placeholder — selected instead. A caret inserts an empty link with the url
 * slot selected. Only the first line of a range is linked: a label cannot
 * cross a line break.
 */
function toggleLink(text: string, selection: MarkdownSelection, url: string | undefined): MarkdownEdit {
	const lines = splitLines(text);
	const line = lineAt(lines, selection.start);
	const start = selection.start;
	const end = Math.min(selection.end, line.end);
	const existing = enclosingLink(findLinks(line), start, end);

	if (existing) {
		const splices: Splice[] = [
			{ at: existing.start, insert: "", remove: 1 },
			{ at: existing.labelEnd, insert: "", remove: existing.end - existing.labelEnd },
		];
		return edit(text, splices, (map) => ({ end: map(end, "before"), start: map(start, "before") }));
	}

	const target = url ?? LINK_PLACEHOLDER;
	const trimmed = trimSegment(text, { end, line, start });

	if (trimmed.start === trimmed.end) {
		const inserted = `[](${target})`;
		return {
			selection: { end: start + 3 + target.length, start: start + 3 },
			text: text.slice(0, start) + inserted + text.slice(start),
		};
	}

	const selected = text.slice(trimmed.start, trimmed.end);
	if (URL_LIKE.test(selected) && url === undefined) {
		return {
			selection: { end: trimmed.start + 1 + LABEL_PLACEHOLDER.length, start: trimmed.start + 1 },
			text: `${text.slice(0, trimmed.start)}[${LABEL_PLACEHOLDER}](${selected})${text.slice(trimmed.end)}`,
		};
	}

	const urlStart = trimmed.start + selected.length + 3;
	return {
		selection: { end: urlStart + target.length, start: urlStart },
		text: `${text.slice(0, trimmed.start)}[${selected}](${target})${text.slice(trimmed.end)}`,
	};
}

/* ─── Line prefixes ────────────────────────────────────────────────────────── */

const HEADING_PREFIX = /^(#{1,6})(?: +|$)/;
const QUOTE_PREFIX = /^> ?/;
const LIST_PREFIX = /^([ \t]*)(?:([-*+])|(\d{1,9})([.)])) /;
const INDENT = /^[ \t]*/;

type ListKind = "bullet" | "ordered";

function listKind(line: string): ListKind | null {
	const match = LIST_PREFIX.exec(line);
	if (!match) return null;
	return match[2] ? "bullet" : "ordered";
}

function headingLevel(line: string): number | null {
	return HEADING_PREFIX.exec(line)?.[1]?.length ?? null;
}

/** One line's prefix change: replace `[at, at + remove)` with `insert`. */
type PrefixChange = Splice;

/**
 * Applies a per-line prefix change to every touched line.
 *
 * With more than one line touched, blank lines are skipped — a list does not
 * number its gaps. A lone blank line is still changed, so a caret on an empty
 * line gets a marker to type after. A caret moves with its line's content and
 * lands after the new prefix if it sat inside the old one; a range grows to
 * cover the whole of every touched line, which is what the next tap — the
 * undo — reads.
 */
function changePrefixes(
	text: string,
	selection: MarkdownSelection,
	change: (lines: readonly Line[]) => (line: Line, ordinal: number) => PrefixChange
): MarkdownEdit {
	const lines = splitLines(text);
	const touched = touchedLines(lines, selection);
	const targets = touched.length > 1 ? touched.filter((line) => line.text.trim() !== "") : touched;
	const first = touched[0] as Line;
	const last = touched[touched.length - 1] as Line;
	if (targets.length === 0) return { selection, text };

	const build = change(targets);
	const splices = targets.map((line, ordinal) => build(line, ordinal));

	if (selection.start === selection.end) {
		return edit(text, splices, (map) => {
			const caret = map(selection.start, "after");
			return { end: caret, start: caret };
		});
	}
	return edit(text, splices, (map) => ({ end: map(last.end, "after"), start: map(first.start, "before") }));
}

function toggleHeading(text: string, selection: MarkdownSelection, level: MarkdownHeadingLevel): MarkdownEdit {
	return changePrefixes(text, selection, (targets) => {
		const allAtLevel = targets.every((line) => headingLevel(line.text) === level);
		return (line) => {
			const existing = HEADING_PREFIX.exec(line.text)?.[0].length ?? 0;
			return { at: line.start, insert: allAtLevel ? "" : `${"#".repeat(level)} `, remove: existing };
		};
	});
}

function toggleQuote(text: string, selection: MarkdownSelection): MarkdownEdit {
	return changePrefixes(text, selection, (targets) => {
		const allQuoted = targets.every((line) => QUOTE_PREFIX.test(line.text));
		return (line) =>
			allQuoted
				? { at: line.start, insert: "", remove: QUOTE_PREFIX.exec(line.text)?.[0].length ?? 0 }
				: { at: line.start, insert: "> ", remove: 0 };
	});
}

function toggleList(text: string, selection: MarkdownSelection, kind: ListKind): MarkdownEdit {
	return changePrefixes(text, selection, (targets) => {
		const allOfKind = targets.every((line) => listKind(line.text) === kind);
		return (line, ordinal) => {
			const match = LIST_PREFIX.exec(line.text);
			const indent = match?.[1]?.length ?? INDENT.exec(line.text)?.[0].length ?? 0;
			const marker = match ? match[0].length - indent : 0;
			const insert = allOfKind ? "" : kind === "bullet" ? "- " : `${ordinal + 1}. `;
			return { at: line.start + indent, insert, remove: marker };
		};
	});
}

/* ─── Fenced blocks ────────────────────────────────────────────────────────── */

/** A fenced block, as line indices. `close` is null for a block never closed — it runs to the end. */
type Fence = { open: number; close: number | null };

function findFences(lines: readonly Line[]): Fence[] {
	const fences: Fence[] = [];
	let open: number | null = null;
	for (const line of lines) {
		if (open === null) {
			if (MARKDOWN_FENCE_OPEN.test(line.text)) open = line.index;
		} else if (MARKDOWN_FENCE_CLOSE.test(line.text)) {
			fences.push({ close: line.index, open });
			open = null;
		}
	}
	if (open !== null) fences.push({ close: null, open });
	return fences;
}

function fenceAround(lines: readonly Line[], first: number, last: number): Fence | undefined {
	return findFences(lines).find((fence) => fence.open <= last && (fence.close ?? lines.length - 1) >= first);
}

/** Removes a whole line along with one of the newlines beside it. */
function removeLine(lines: readonly Line[], index: number): Splice {
	const line = lines[index] as Line;
	const next = lines[index + 1];
	if (next) return { at: line.start, insert: "", remove: next.start - line.start };
	const previous = lines[index - 1];
	if (previous) return { at: previous.end, insert: "", remove: line.end - previous.end };
	return { at: line.start, insert: "", remove: line.end - line.start };
}

/**
 * A fenced code block.
 *
 * Inside a block — on its fences or between them — the fences come off. On an
 * empty line a caret gets a three-line template with the caret in the middle.
 * Otherwise the touched lines are fenced whole, never split mid-line, and stay
 * selected.
 */
function toggleCodeBlock(text: string, selection: MarkdownSelection): MarkdownEdit {
	const lines = splitLines(text);
	const touched = touchedLines(lines, selection);
	const first = touched[0] as Line;
	const last = touched[touched.length - 1] as Line;
	const fence = fenceAround(lines, first.index, last.index);

	if (fence) {
		const splices = [removeLine(lines, fence.open)];
		if (fence.close !== null) splices.push(removeLine(lines, fence.close));
		return edit(text, splices, (map) => ({
			end: map(selection.end, "before"),
			start: map(selection.start, "before"),
		}));
	}

	if (selection.start === selection.end && first.text === "") {
		const caret = first.start + 4;
		return {
			selection: { end: caret, start: caret },
			text: `${text.slice(0, first.start)}\`\`\`\n\n\`\`\`${text.slice(first.end)}`,
		};
	}

	const splices: Splice[] = [
		{ at: first.start, insert: "```\n", remove: 0 },
		{ at: last.end, insert: "\n```", remove: 0 },
	];
	if (selection.start === selection.end) {
		return edit(text, splices, (map) => {
			const caret = map(selection.start, selection.start === first.start ? "after" : "before");
			return { end: caret, start: caret };
		});
	}
	return edit(text, splices, (map) => ({
		end: map(selection.end, "before"),
		start: map(selection.start, "after"),
	}));
}

/* ─── Public API ───────────────────────────────────────────────────────────── */

/**
 * Applies one formatting command to the text at a selection.
 *
 * Pure: the same text, selection and command always give the same edit, on
 * every platform. Every command is a toggle, so applying it twice to its own
 * result restores the original text exactly. The selection that comes back is
 * always ordered and inside the new text, and never splits a surrogate pair.
 *
 * Inline marks (`bold` `**`, `italic` `_`, `code` `` ` ``, `strikethrough`
 * `~~`) wrap a selection and keep it selected, or put an empty pair round a
 * caret; they never span a line break. Line formats (`heading`, `quote`,
 * `bulletList`, `orderedList`) apply to every touched line, and a range comes
 * back covering those lines whole.
 *
 * @example
 * applyMarkdownCommand("say hi", { start: 4, end: 6 }, { type: "bold" });
 * // { text: "say **hi**", selection: { start: 6, end: 8 } }
 */
export function applyMarkdownCommand(
	text: string,
	selection: MarkdownSelection,
	command: MarkdownCommand
): MarkdownEdit {
	const normalized = normalizeMarkdownSelection(text, selection);
	switch (command.type) {
		case "bold":
		case "italic":
		case "code":
		case "strikethrough":
			return toggleInline(text, normalized, INLINE_MARKERS[command.type]);
		case "link":
			return toggleLink(text, normalized, command.url);
		case "heading":
			return toggleHeading(text, normalized, command.level);
		case "quote":
			return toggleQuote(text, normalized);
		case "bulletList":
			return toggleList(text, normalized, "bullet");
		case "orderedList":
			return toggleList(text, normalized, "ordered");
		case "codeBlock":
			return toggleCodeBlock(text, normalized);
		default: {
			const exhaustive: never = command;
			return exhaustive;
		}
	}
}

const ACTIVE_INLINE: readonly ["bold" | "italic" | "strikethrough" | "code", InlineMarker][] = [
	["bold", "**"],
	["italic", "_"],
	["strikethrough", "~~"],
	["code", "`"],
];

/**
 * The formats in effect at a selection, for lighting toolbar buttons.
 *
 * Read from the line the selection starts on: line formats first (`heading`,
 * `quote`, `bulletList`, `orderedList`), then the inline marks whose run holds
 * the selection, then `link`. Inside a fenced block the answer is only
 * `codeBlock` — a `**` in code is two asterisks, not bold.
 *
 * Italic is reported for `_x_`, the form the toolbar writes. `*x*` previews as
 * italic but does not light the button; the toolbar would write the other form
 * to remove it.
 */
export function getActiveMarkdownCommands(text: string, selection: MarkdownSelection): readonly MarkdownCommandType[] {
	const { start, end } = normalizeMarkdownSelection(text, selection);
	const lines = splitLines(text);
	const line = lineAt(lines, start);
	if (fenceAround(lines, line.index, line.index)) return ["codeBlock"];

	const active: MarkdownCommandType[] = [];
	const level = headingLevel(line.text);
	if (level !== null && level <= 3) active.push("heading");
	if (QUOTE_PREFIX.test(line.text)) active.push("quote");
	const kind = listKind(line.text);
	if (kind === "bullet") active.push("bulletList");
	if (kind === "ordered") active.push("orderedList");

	const clippedEnd = Math.min(end, line.end);
	for (const [type, marker] of ACTIVE_INLINE) {
		if (enclosingRun(findRuns(text, line, marker), start, clippedEnd)) active.push(type);
	}
	if (enclosingLink(findLinks(line), start, clippedEnd)) active.push("link");
	return active;
}

/**
 * The heading level the toolbar's one heading button applies next.
 *
 * Steps one, two, three, and then three again — which `applyMarkdownCommand`
 * reads as "same level" and removes. So repeated taps cycle through the levels
 * and back to body text, from a single button.
 */
export function getNextHeadingLevel(text: string, selection: MarkdownSelection): MarkdownHeadingLevel {
	const { start } = normalizeMarkdownSelection(text, selection);
	const level = headingLevel(lineAt(splitLines(text), start).text);
	if (level === null) return 1;
	if (level === 1) return 2;
	return 3;
}

/**
 * Continues a list when Return is pressed in one.
 *
 * Compares the text before and after a change. When the change is a single
 * newline typed after a bullet, a number or a quote marker, the new line gets
 * the next marker — the same bullet, the next number, another `> ` — at the
 * same indent, with the caret after it. Return on an item with nothing after
 * its marker removes the marker instead and ends the list. Anything else —
 * typing, a paste, a deletion, a newline inside a fenced block — returns
 * `null`, and the change stands as typed.
 *
 * A newline typed beside another newline is ambiguous from the text alone:
 * `"- a\n"` + Return could be a press at the end of `- a` or on the empty line
 * after it. `caret`, the selection's start before the change, settles it when
 * it names the earliest of those positions; anything else is read as the
 * latest — a plain newline — because continuing a list that has just been
 * ended would make it impossible to leave.
 */
export function continueMarkdownList(prev: string, next: string, caret?: number): MarkdownEdit | null {
	if (next.length !== prev.length + 1) return null;
	let latest = 0;
	while (latest < prev.length && prev[latest] === next[latest]) latest++;
	if (next[latest] !== "\n" || next.slice(latest + 1) !== prev.slice(latest)) return null;

	let earliest = latest;
	while (earliest > 0 && prev[earliest - 1] === "\n") earliest--;
	const at = caret === earliest ? earliest : latest;

	const lines = splitLines(prev);
	const line = lineAt(lines, at);
	if (fenceAround(lines, line.index, line.index)) return null;

	const list = LIST_PREFIX.exec(line.text);
	const quote = list ? null : QUOTE_PREFIX.exec(line.text);
	const prefix = list?.[0] ?? quote?.[0];
	if (prefix === undefined || at < line.start + prefix.length) return null;

	if (line.text.slice(prefix.length).trim() === "") {
		return {
			selection: { end: line.start, start: line.start },
			text: prev.slice(0, line.start) + prev.slice(line.end),
		};
	}

	let marker = "> ";
	if (list) {
		const indent = list[1] ?? "";
		marker = list[2] ? `${indent}${list[2]} ` : `${indent}${Number(list[3]) + 1}${list[4]} `;
	}
	const position = at + 1 + marker.length;
	return {
		selection: { end: position, start: position },
		text: `${prev.slice(0, at)}\n${marker}${prev.slice(at)}`,
	};
}
