import type { MarkdownHeadingLevel } from "./markdown-editor.types";

/** A run of inline content. `text` and `code` are leaves; the rest hold children. */
export type MarkdownInline =
	| { type: "text"; value: string }
	| { type: "bold"; children: MarkdownInline[] }
	| { type: "italic"; children: MarkdownInline[] }
	| { type: "strikethrough"; children: MarkdownInline[] }
	| { type: "code"; value: string }
	| { type: "link"; url: string; children: MarkdownInline[] };

/** One block of a document. A quote holds blocks; a list holds one inline run per item. */
export type MarkdownBlock =
	| { type: "heading"; level: MarkdownHeadingLevel; children: MarkdownInline[] }
	| { type: "paragraph"; children: MarkdownInline[] }
	| { type: "quote"; children: MarkdownBlock[] }
	| { type: "list"; ordered: boolean; start: number; items: MarkdownInline[][] }
	| { type: "codeBlock"; language: string | null; value: string };

/**
 * A line that opens a fenced code block, and one that closes it.
 *
 * Exported because the commands have to agree with the parser about where a
 * block starts and ends — `applyMarkdownCommand` toggles a fence off, and
 * `getActiveMarkdownCommands` stops reporting inline marks inside one. Two
 * definitions would be two answers to "is the caret in code?".
 */
export const MARKDOWN_FENCE_OPEN = /^```(.*)$/;
export const MARKDOWN_FENCE_CLOSE = /^```\s*$/;

/** The schemes a link may point at. Everything else drops to its label. */
export const MARKDOWN_SAFE_SCHEMES = ["http", "https", "mailto", "tel"] as const;

const SAFE_SCHEMES = new Set<string>(MARKDOWN_SAFE_SCHEMES);
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Whether a link's url is one the preview may open.
 *
 * An allow-list rather than a block-list: `javascript:`, `data:`, `file:` and
 * any scheme an app registers would each need naming, and the one that was
 * forgotten is the one that runs. A url carrying whitespace or a control
 * character is refused outright, which is what stops `java\tscript:` and a
 * leading space slipping past the scheme check — a url the browser would
 * normalise into something the check never saw.
 */
export function isSafeUrl(url: string): boolean {
	for (let i = 0; i < url.length; i++) {
		const code = url.charCodeAt(i);
		if (code <= 0x20 || code === 0x7f) return false;
	}
	const match = SCHEME.exec(url);
	return match?.[1] !== undefined && SAFE_SCHEMES.has(match[1].toLowerCase());
}

const HEADING = /^(#{1,3})(?:[ \t]+(.*))?$/;
const BULLET = /^[ \t]*[-*+][ \t]+(.*)$/;
const ORDERED = /^[ \t]*(\d{1,9})[.)][ \t]+(.*)$/;
const QUOTE = /^>[ \t]?(.*)$/;
const BLANK = /^\s*$/;

type ListKind = "bullet" | "ordered";

function listKind(line: string): ListKind | null {
	if (BULLET.test(line)) return "bullet";
	if (ORDERED.test(line)) return "ordered";
	return null;
}

/** Whether a line starts a block of its own, and so ends a paragraph or a list item above it. */
function startsBlock(line: string): boolean {
	return MARKDOWN_FENCE_OPEN.test(line) || HEADING.test(line) || QUOTE.test(line) || listKind(line) !== null;
}

function parseBlocks(lines: readonly string[]): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i] ?? "";

		if (BLANK.test(line)) {
			i++;
			continue;
		}

		const fence = MARKDOWN_FENCE_OPEN.exec(line);
		if (fence) {
			const body: string[] = [];
			i++;
			while (i < lines.length && !MARKDOWN_FENCE_CLOSE.test(lines[i] ?? "")) {
				body.push(lines[i] ?? "");
				i++;
			}
			// Past the closing fence, or past the end for one never closed.
			i++;
			const language = (fence[1] ?? "").trim();
			blocks.push({ language: language === "" ? null : language, type: "codeBlock", value: body.join("\n") });
			continue;
		}

		const heading = HEADING.exec(line);
		if (heading) {
			const level = (heading[1]?.length ?? 1) as MarkdownHeadingLevel;
			blocks.push({ children: parseInline((heading[2] ?? "").trimEnd()), level, type: "heading" });
			i++;
			continue;
		}

		if (QUOTE.test(line)) {
			const inner: string[] = [];
			while (i < lines.length) {
				const quoted = QUOTE.exec(lines[i] ?? "");
				if (!quoted) break;
				inner.push(quoted[1] ?? "");
				i++;
			}
			blocks.push({ children: parseBlocks(inner), type: "quote" });
			continue;
		}

		const kind = listKind(line);
		if (kind) {
			const items: string[] = [];
			const start = kind === "ordered" ? Number(ORDERED.exec(line)?.[1] ?? 1) : 1;
			while (i < lines.length) {
				const current = lines[i] ?? "";
				if (BLANK.test(current)) break;
				const item = kind === "bullet" ? BULLET.exec(current) : ORDERED.exec(current);
				if (item) {
					items.push(item[kind === "bullet" ? 1 : 2] ?? "");
				} else if (startsBlock(current)) {
					break;
				} else {
					// A lazy line: plain text straight under an item continues it.
					items[items.length - 1] = `${items[items.length - 1] ?? ""}\n${current.trimStart()}`;
				}
				i++;
			}
			blocks.push({ items: items.map(parseInline), ordered: kind === "ordered", start, type: "list" });
			continue;
		}

		const paragraph: string[] = [line];
		i++;
		while (i < lines.length) {
			const current = lines[i] ?? "";
			if (BLANK.test(current) || startsBlock(current)) break;
			paragraph.push(current);
			i++;
		}
		blocks.push({ children: parseInline(paragraph.join("\n").trim()), type: "paragraph" });
	}

	return blocks;
}

/**
 * Parses the Markdown subset the editor's toolbar writes.
 *
 * Headings one to three, paragraphs, quotes, bullet and ordered lists, fenced
 * code; inside them bold, italic, strikethrough, inline code and links. Nothing
 * else — no tables, images, HTML or footnotes — and anything outside the subset
 * is kept as the literal text it was typed as rather than dropped.
 *
 * Plain JavaScript with no platform branch, so iOS and Android render the same
 * document. Line endings are `\n`; a `\r\n` document keeps its `\r` as text.
 *
 * Runs in time linear in the input. No regular expression here can backtrack
 * across a line, and every inline closer is found by binary search over a list
 * built once — so a pasted wall of `*` or `[` costs what a paragraph does.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
	if (source === "") return [];
	return parseBlocks(source.split("\n"));
}

const PUNCTUATION = /[!-/:-@[-`{-~]/;
const WHITESPACE = /\s/;
const WORD = /[\p{L}\p{N}]/u;

function isWhitespace(char: string | undefined): boolean {
	if (char === undefined) return true;
	const code = char.charCodeAt(0);
	if (code < 0x80) return code === 0x20 || (code >= 0x09 && code <= 0x0d);
	return WHITESPACE.test(char);
}

function isWord(char: string | undefined): boolean {
	if (char === undefined) return false;
	const code = char.charCodeAt(0);
	if (code < 0x80) return (code >= 0x30 && code <= 0x39) || ((code | 0x20) >= 0x61 && (code | 0x20) <= 0x7a);
	return WORD.test(char);
}

/** First index in an ascending list whose value is at least `value`. */
function lowerBound(list: readonly number[], value: number): number {
	let low = 0;
	let high = list.length;
	while (low < high) {
		const mid = (low + high) >>> 1;
		if ((list[mid] ?? 0) < value) low = mid + 1;
		else high = mid;
	}
	return low;
}

/** The first entry of an ascending list at or after `from`, if it lies before `to`. */
function firstIn(list: readonly number[] | undefined, from: number, to: number): number | null {
	if (!list) return null;
	const found = list[lowerBound(list, from)];
	return found !== undefined && found < to ? found : null;
}

type EmphasisChar = "*" | "_" | "~";

function canOpen(char: EmphasisChar, before: string | undefined, after: string | undefined): boolean {
	if (isWhitespace(after)) return false;
	return char !== "_" || !isWord(before);
}

function canClose(char: EmphasisChar, before: string | undefined, after: string | undefined): boolean {
	if (isWhitespace(before)) return false;
	return char !== "_" || !isWord(after);
}

/**
 * Everything the inline pass looks up, built in one walk over the source.
 *
 * `runEnd[i]` is where the delimiter run holding `i` ends. `closers` lists,
 * per character and per minimum length, the start of every run able to close —
 * so finding a closer is a binary search rather than a scan, and an opener
 * with no closer costs a logarithm rather than the rest of the line.
 */
type InlineIndex = {
	source: string;
	runEnd: Int32Array;
	closers: Record<EmphasisChar, readonly number[][]>;
	codeRuns: Map<number, number[]>;
	brackets: number[];
	parens: number[];
};

function buildIndex(source: string): InlineIndex {
	const runEnd = new Int32Array(source.length);
	const closers: Record<EmphasisChar, number[][]> = {
		"*": [[], [], [], []],
		_: [[], [], [], []],
		"~": [[], [], [], []],
	};
	const codeRuns = new Map<number, number[]>();
	const brackets: number[] = [];
	const parens: number[] = [];

	const push = <K>(map: Map<K, number[]>, key: K, value: number): void => {
		const list = map.get(key);
		if (list) list.push(value);
		else map.set(key, [value]);
	};

	let i = 0;
	while (i < source.length) {
		const char = source[i];
		if (char === "\\" && i + 1 < source.length && PUNCTUATION.test(source[i + 1] ?? "")) {
			i += 2;
			continue;
		}
		if (char === "]") brackets.push(i);
		if (char === ")") parens.push(i);
		if (char === "*" || char === "_" || char === "~" || char === "`") {
			let end = i + 1;
			while (end < source.length && source[end] === char) end++;
			runEnd.fill(end, i, end);
			const length = end - i;
			if (char === "`") {
				push(codeRuns, length, i);
			} else if (canClose(char, source[i - 1], source[end])) {
				for (let k = 1; k <= Math.min(length, 3); k++) closers[char][k]?.push(i);
			}
			i = end;
			continue;
		}
		i++;
	}

	return { brackets, closers, codeRuns, parens, runEnd, source };
}

function pushText(out: MarkdownInline[], value: string): void {
	if (value === "") return;
	const last = out[out.length - 1];
	if (last?.type === "text") last.value += value;
	else out.push({ type: "text", value });
}

function pushSlice(out: MarkdownInline[], source: string, from: number, to: number): void {
	if (to > from) pushText(out, source.slice(from, to));
}

function pushAll(out: MarkdownInline[], nodes: readonly MarkdownInline[]): void {
	for (const node of nodes) {
		if (node.type === "text") pushText(out, node.value);
		else out.push(node);
	}
}

function parseRange(index: InlineIndex, from: number, to: number): MarkdownInline[] {
	const { source } = index;
	const out: MarkdownInline[] = [];
	// Plain text is never copied a character at a time: the run since the last
	// node is sliced out once, when something that is not text interrupts it.
	let literal = from;
	let i = from;

	while (i < to) {
		const char = source[i];

		if (char === "\\" && i + 1 < to && PUNCTUATION.test(source[i + 1] ?? "")) {
			pushSlice(out, source, literal, i);
			literal = i + 1;
			i += 2;
			continue;
		}

		if (char === "`") {
			const length = Math.min(index.runEnd[i] ?? i + 1, to) - i;
			const close = firstIn(index.codeRuns.get(length), i + length, to);
			if (close !== null && close + length <= to) {
				pushSlice(out, source, literal, i);
				out.push({ type: "code", value: source.slice(i + length, close) });
				i = close + length;
				literal = i;
			} else {
				i += length;
			}
			continue;
		}

		if (char === "*" || char === "_" || char === "~") {
			const length = Math.min(index.runEnd[i] ?? i + 1, to) - i;
			const opened = canOpen(char, source[i - 1], source[i + length]) ? openEmphasis(index, char, i, length, to) : null;
			if (opened) {
				pushSlice(out, source, literal, i + opened.extra);
				out.push(opened.node);
				i = opened.next;
				literal = i;
			} else {
				i += length;
			}
			continue;
		}

		if (char === "[") {
			const link = openLink(index, i, to);
			if (link) {
				pushSlice(out, source, literal, i);
				if (link.url === null) pushAll(out, link.label);
				else out.push({ children: link.label, type: "link", url: link.url });
				i = link.next;
				literal = i;
				continue;
			}
		}

		i++;
	}

	pushSlice(out, source, literal, to);
	return out;
}

const EMPHASIS_WIDTHS = [3, 2, 1] as const;
const STRIKE_WIDTHS = [2] as const;

type Opened = { node: MarkdownInline; extra: number; next: number };

/**
 * Tries to open emphasis at a delimiter run of `length` characters.
 *
 * Three of `*` or `_` try bold-and-italic first, then bold, then italic; `~`
 * only ever means strikethrough, and needs two. The opener consumes the end of
 * its run nearest the text and the closer the start of its own, so `***x***`
 * nests rather than leaving a stray marker either side. Characters of the run
 * an opener does not use are literal text before it.
 */
function openEmphasis(index: InlineIndex, char: EmphasisChar, at: number, length: number, to: number): Opened | null {
	for (const width of char === "~" ? STRIKE_WIDTHS : EMPHASIS_WIDTHS) {
		if (width > length) continue;
		const close = firstIn(index.closers[char][width], at + length, to);
		if (close === null || close + width > to) continue;
		const children = parseRange(index, at + length, close);
		const node: MarkdownInline =
			char === "~"
				? { children, type: "strikethrough" }
				: width === 3
					? { children: [{ children, type: "italic" }], type: "bold" }
					: width === 2
						? { children, type: "bold" }
						: { children, type: "italic" };
		return { extra: length - width, next: close + width, node };
	}
	return null;
}

/**
 * Tries to open a link at a `[`.
 *
 * The label runs to the first `]`, which has to be followed by `(`; the url
 * runs to the first `)` after that and may not hold whitespace. A url that
 * fails `isSafeUrl` comes back as `null` beside the label — the caller spreads
 * the label in as plain content, so the words survive and nothing is
 * pressable. A link with an empty label shows its url.
 */
function openLink(
	index: InlineIndex,
	at: number,
	to: number
): { label: MarkdownInline[]; url: string | null; next: number } | null {
	const { source } = index;
	const close = firstIn(index.brackets, at + 1, to);
	if (close === null || source[close + 1] !== "(") return null;
	const paren = firstIn(index.parens, close + 2, to);
	if (paren === null) return null;
	const url = source.slice(close + 2, paren);
	if (url === "" || WHITESPACE.test(url)) return null;
	const label = parseRange(index, at + 1, close);
	if (!isSafeUrl(url)) return { label, next: paren + 1, url: null };
	return { label: label.length > 0 ? label : [{ type: "text", value: url }], next: paren + 1, url };
}

/** Parses one run of inline Markdown — a paragraph's text, a heading's, a list item's. */
export function parseInline(source: string): MarkdownInline[] {
	return parseRange(buildIndex(source), 0, source.length);
}
