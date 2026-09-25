import { describe, expect, test } from "bun:test";
import { read, relative, SRC, sourceFiles } from "./source-tree.test";

/**
 * This package emits no `className`.
 *
 * That is the promise the engine/skin split rests on: radii, colours and
 * spacing arrive as `style`, and `@delacour/react-native-ui` is the only place
 * tokens exist. It also has a concrete consequence in the playground — Tailwind's
 * scanner needs no `@source` line pointing here, because there is nothing to
 * scan. A stray `className` would make that missing line a silent bug where a
 * class compiles in development and vanishes from a release build.
 *
 * So the promise is checked rather than hoped for.
 */
describe("no className", () => {
	const files = sourceFiles(SRC, { skipTests: true });

	// A stub-sized floor. BSHEET-2 raises this to `> 20` once the React layer lands.
	test("finds the source, so a broken walker cannot pass silently", () => {
		expect(files.length).toBeGreaterThan(4);
	});

	test("no module names className", () => {
		const offenders = files.filter((file) => read(file).includes("className")).map((file) => relative(file));
		expect(offenders).toEqual([]);
	});
});
