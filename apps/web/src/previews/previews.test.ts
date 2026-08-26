import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Every `<Preview id="…" />` in the content names a preview that exists.
 *
 * This is the assertion that earns its keep here. `tsc --noEmit` covers
 * `**\/*.ts{,x}` only, so MDX is never typechecked — the `PreviewId` union makes
 * `<Preview>` safe in TSX and does nothing at all for the person writing a
 * component page. Without this, a typo is a runtime 500 discovered by a reader.
 *
 * The manifest is read as text rather than imported: it is generated, and a
 * suite that imports it would fail for a missing module rather than for the
 * thing it is actually checking.
 */

const WEB = join(import.meta.dirname, "..", "..");
const CONTENT = join(WEB, "content");
const MANIFEST = join(import.meta.dirname, "manifest.ts");

function manifestIds(): Set<string> {
	if (!existsSync(MANIFEST)) return new Set();
	const source = readFileSync(MANIFEST, "utf-8");
	return new Set([...source.matchAll(/^\t"([^"]+)": \{$/gm)].map(([, id]) => id as string));
}

function mdxFiles(): string[] {
	const found: string[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (entry.name.endsWith(".mdx")) found.push(path);
		}
	};
	walk(CONTENT);
	return found;
}

type Reference = { file: string; id: string };

function references(): Reference[] {
	const found: Reference[] = [];
	for (const path of mdxFiles()) {
		const source = readFileSync(path, "utf-8");
		for (const [, id] of source.matchAll(/<Preview\s+id="([^"]+)"/g)) {
			found.push({ file: relative(WEB, path), id: id as string });
		}
	}
	return found;
}

const REFERENCES = references();
const IDS = manifestIds();

describe("preview references", () => {
	// A walker that found nothing would let the assertion below pass vacuously.
	test("finds the content tree", () => {
		expect(mdxFiles().length).toBeGreaterThan(10);
	});

	test("every referenced preview exists in the manifest", () => {
		const unknown = REFERENCES.filter((reference) => !IDS.has(reference.id)).map(
			(reference) => `${reference.file} → ${reference.id}`
		);
		expect(unknown).toEqual([]);
	});

	// A page can name the same preview twice; two pages naming one preview means
	// the same picture is presented as two different things.
	test("no preview is used on two different pages", () => {
		const pages = new Map<string, Set<string>>();
		for (const reference of REFERENCES) {
			pages.set(reference.id, (pages.get(reference.id) ?? new Set()).add(reference.file));
		}
		const shared = [...pages]
			.filter(([, files]) => files.size > 1)
			.map(([id, files]) => `${id} on ${[...files].join(", ")}`);
		expect(shared).toEqual([]);
	});
});
