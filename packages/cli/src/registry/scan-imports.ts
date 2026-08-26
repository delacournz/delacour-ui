import ts from "typescript";

/**
 * Every module specifier in a TypeScript source file, with the span it occupies.
 *
 * This exists because the obvious cheap option is wrong. `Bun.Transpiler`'s
 * `scanImports` reports what survives *transpilation*, so a type-only import is
 * simply absent from its output — and `native-ui` is full of them. Every
 * component's `index.ts` re-exports its prop types with
 * `export type { ButtonSlotProps } from "./button.types"`, and a scanner that
 * cannot see those lines would drop `button.types.ts` from the registry item
 * and ship a component that does not compile.
 *
 * TypeScript's own `preProcessFile` is a syntactic scanner, so it sees type-only
 * imports and `export … from` while still ignoring a specifier-shaped string in
 * a comment or a literal. It runs at build time only and never reaches the
 * published CLI bundle.
 */

export type ScannedImport = {
	specifier: string;
	/** Offset of the first character of the specifier, inside the quotes. */
	start: number;
	/** Offset one past the last character of the specifier. */
	end: number;
};

export function scanImports(content: string): ScannedImport[] {
	const { importedFiles } = ts.preProcessFile(content, true, true);

	return importedFiles.map((reference) => {
		// `pos` lands on the opening quote and `end` one short of the closing one,
		// so the specifier itself is offset by one. Asserted rather than trusted:
		// a TypeScript upgrade that changed this would otherwise corrupt every
		// rewritten import silently.
		const start = reference.pos + 1;
		const end = start + reference.fileName.length;

		if (content.slice(start, end) !== reference.fileName) {
			throw new Error(
				`Import scan misaligned: expected "${reference.fileName}" at ${start}, found "${content.slice(start, end)}"`
			);
		}

		return { specifier: reference.fileName, start, end };
	});
}
