/**
 * Whether two versions of a file differ only in how they are laid out.
 *
 * The fallback for a project whose formatter the CLI cannot run. With one, the
 * registry's text goes through it and is compared exactly; without one, this
 * is how a file that was only reformatted is told from a file someone edited.
 *
 * It errs one way on purpose. Layout is ignored only where it cannot carry
 * meaning — whitespace, a trailing semicolon, a trailing comma, which quote a
 * string is written in. The inside of a string is compared exactly, so a
 * changed class list is always an edit. Anything this is unsure of reads as an
 * edit, and an edit is merged rather than overwritten.
 *
 * Never used to produce a file, only to answer yes or no.
 */
export function sameModuloFormatting(a: string, b: string): boolean {
	return a === b || normalise(a) === normalise(b);
}

const WORD = /[\w$]/;
const CLOSERS = new Set([")", "]", "}"]);

type State = {
	out: string;
	/** The quote that opened the string being read, if one is open. */
	quote: string | null;
	/** Whitespace was passed and nothing has been written since. */
	space: boolean;
};

export function normalise(source: string): string {
	const state: State = { out: "", quote: null, space: false };

	for (let index = 0; index < source.length; index += 1) {
		const char = source[index] as string;

		if (state.quote === null) {
			outside(state, char);
		} else if (char === "\\") {
			// An escape is two characters of content, whatever the second one is.
			state.out += char + (source[index + 1] ?? "");
			index += 1;
		} else {
			inside(state, char, state.quote);
		}
	}

	return state.out;
}

/** One character of a string: compared exactly, apart from which quote ends it. */
function inside(state: State, char: string, quote: string): void {
	// A plain string cannot cross a line, so a stray apostrophe in a comment or
	// in JSX text stops being a string at the end of its line.
	if (char === "\n" && quote !== "`") {
		state.quote = null;
		state.space = true;
		return;
	}

	if (char === quote) {
		state.out += delimiter(quote);
		state.quote = null;
		return;
	}

	state.out += char;
}

/** One character of code: layout dropped, everything else kept. */
function outside(state: State, char: string): void {
	if (/\s/.test(char)) {
		state.space = true;
		return;
	}

	if (char === ";") return;

	// A trailing comma: the one before a closing bracket.
	if (CLOSERS.has(char) && state.out.endsWith(",")) state.out = state.out.slice(0, -1);

	const opens = char === '"' || char === "'" || char === "`";

	// Whitespace only separates anything between two words — `return x`.
	if (state.space && WORD.test(state.out.at(-1) ?? "") && (opens || WORD.test(char))) state.out += " ";
	state.space = false;

	if (opens) state.quote = char;
	state.out += opens ? delimiter(char) : char;
}

/** `'` and `"` are the same string; a template literal is not. */
function delimiter(quote: string): string {
	return quote === "`" ? "`" : '"';
}
