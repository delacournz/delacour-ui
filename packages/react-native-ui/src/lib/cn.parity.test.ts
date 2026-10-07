import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extendTailwindMerge } from "tailwind-merge";
import { type CustomClassGroupId, TW_MERGE_CONFIG } from "../styles/tokens";
import { cn } from "./cn";

/**
 * `cn` against the tailwind-merge it replaced, on this library's own classes.
 *
 * `cn` promises tailwind-merge's output for every input; this holds it to that
 * on the strings that matter here — every class literal in a `*.variants.ts`,
 * merged pairwise with a caller-style override, through the same
 * `TW_MERGE_CONFIG`. tailwind-merge stays installed as `tailwind-variants`'
 * peer, which is what makes the reference available.
 */
const reference = extendTailwindMerge<CustomClassGroupId>(TW_MERGE_CONFIG);

function variantFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return variantFiles(path);
		return entry.name.endsWith(".variants.ts") ? [path] : [];
	});
}

const literals = [
	...new Set(
		variantFiles(join(import.meta.dir, "../components")).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/"([a-z0-9!:[\]/.\-_% ]+)"/g)]
				.map((match) => match[1] ?? "")
				.filter((value) => value.includes("-"))
		)
	),
];

const OVERRIDES = [
	"p-4",
	"h-12",
	"rounded-none",
	"bg-destructive",
	"text-sm",
	"text-primary",
	"opacity-50",
	"h-button-sm",
];

describe("cn matches tailwind-merge on the library's classes", () => {
	test("found a real corpus", () => {
		expect(literals.length).toBeGreaterThan(100);
	});

	test("every literal alone", () => {
		for (const value of literals) expect(cn(value)).toBe(reference(value));
	});

	test("every literal under a caller override", () => {
		for (const value of literals) {
			for (const override of OVERRIDES) expect(cn(value, override)).toBe(reference(value, override));
		}
	});
});
