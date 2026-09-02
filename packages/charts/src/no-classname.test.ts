import { describe, expect, test } from "bun:test";
import { read, relative, SRC, sourceFiles } from "./source-tree.test";

/**
 * This package emits no `className`.
 *
 * That is the promise the whole two-package split rests on: colours, fonts and
 * sizes arrive as values, and `@delacour/native-ui` is the only place tokens
 * exist. It also has a concrete consequence in the playground — Tailwind's
 * scanner needs no `@source` line pointing here, because there is nothing to
 * scan. A stray `className` would make that missing line a silent bug where a
 * class compiles in development and vanishes from a release build.
 *
 * So the promise is checked rather than hoped for.
 */
describe("no className", () => {
	const files = sourceFiles(SRC, { skipTests: true });

	test("finds the source, so a broken walker cannot pass silently", () => {
		expect(files.length).toBeGreaterThan(20);
	});

	test("no module names className", () => {
		const offenders = files.filter((file) => read(file).includes("className")).map((file) => relative(file));
		expect(offenders).toEqual([]);
	});
});
