/**
 * Parses JSON with comments and trailing commas.
 *
 * `tsconfig.json` is JSONC, and a real one usually has comments in it — the
 * playground in this repo explains its `react-native` path mapping in three
 * lines of them. `JSON.parse` throws on all of it, and the CLI only ever reads
 * these files, so a small stripper is the whole requirement. Nothing is written
 * back: a formatter that dropped a project's comments would be a poor trade for
 * an alias the CLI can simply do without.
 */
export function parseJsonc<T = unknown>(text: string): T {
	return JSON.parse(stripJsonc(text)) as T;
}

/**
 * Blanks comments and drops trailing commas, preserving every other offset.
 *
 * A character-by-character pass rather than a regex, because a `//` inside a
 * string literal is not a comment — and a Windows path in a `paths` mapping is
 * full of escapes that a regex would misread.
 */
export function stripJsonc(text: string): string {
	let output = "";
	let index = 0;

	while (index < text.length) {
		const character = text[index] as string;

		if (character === '"') {
			const end = endOfString(text, index);
			output += text.slice(index, end);
			index = end;
			continue;
		}

		if (character === "/" && text[index + 1] === "/") {
			index = indexOrEnd(text.indexOf("\n", index), text.length);
			continue;
		}

		if (character === "/" && text[index + 1] === "*") {
			const close = text.indexOf("*/", index + 2);
			index = close === -1 ? text.length : close + 2;
			continue;
		}

		if (character === "," && startsClosingBracket(text, index + 1)) {
			index += 1;
			continue;
		}

		output += character;
		index += 1;
	}

	return output;
}

/** Index one past the closing quote, honouring backslash escapes. */
function endOfString(text: string, start: number): number {
	let index = start + 1;

	while (index < text.length) {
		const character = text[index];
		if (character === "\\") {
			index += 2;
			continue;
		}
		if (character === '"') return index + 1;
		index += 1;
	}

	return text.length;
}

/** Whether the next non-whitespace, non-comment character closes an object or array. */
function startsClosingBracket(text: string, from: number): boolean {
	let index = from;

	while (index < text.length) {
		const character = text[index] as string;

		if (/\s/.test(character)) {
			index += 1;
			continue;
		}
		if (character === "/" && text[index + 1] === "/") {
			index = indexOrEnd(text.indexOf("\n", index), text.length);
			continue;
		}
		if (character === "/" && text[index + 1] === "*") {
			const close = text.indexOf("*/", index + 2);
			if (close === -1) return false;
			index = close + 2;
			continue;
		}

		return character === "}" || character === "]";
	}

	return false;
}

function indexOrEnd(index: number, end: number): number {
	return index === -1 ? end : index;
}
