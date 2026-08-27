import { describe, expect, test } from "bun:test";
import { parseJsonc } from "./jsonc";

describe("parseJsonc", () => {
	test("reads plain JSON", () => {
		expect(parseJsonc<Record<string, number>>('{"a": 1}')).toEqual({ a: 1 });
	});

	test("drops line and block comments", () => {
		const text = `{
			// the alias every Expo template ships with
			"paths": { "@/*": ["./src/*"] }, /* inline */
			"strict": true
		}`;

		expect(parseJsonc<Record<string, unknown>>(text)).toEqual({ paths: { "@/*": ["./src/*"] }, strict: true });
	});

	test("drops trailing commas before a close", () => {
		expect(parseJsonc<Record<string, unknown>>('{"a": [1, 2,], "b": 3,}')).toEqual({ a: [1, 2], b: 3 });
	});

	test("drops a trailing comma that is followed by a comment", () => {
		expect(parseJsonc<Record<string, number>>('{"a": 1, // why\n}')).toEqual({ a: 1 });
	});

	test("leaves comment markers inside strings alone", () => {
		expect(parseJsonc<Record<string, string>>('{"url": "https://example.com/a", "glob": "**/*"}')).toEqual({
			url: "https://example.com/a",
			glob: "**/*",
		});
	});

	test("respects escaped quotes", () => {
		expect(parseJsonc<Record<string, string>>('{"quote": "a \\" b // not a comment"}')).toEqual({
			quote: 'a " b // not a comment',
		});
	});

	test("handles the real playground tsconfig shape", () => {
		const text = `{
	"extends": "expo/tsconfig.base",
	"compilerOptions": {
		"paths": {
			"@/*": ["./src/*"],
			// Pin both to the root copy.
			"react-native": ["../../node_modules/react-native"],
		},
	},
}`;

		expect(parseJsonc<{ compilerOptions: { paths: Record<string, string[]> } }>(text).compilerOptions.paths).toEqual({
			"@/*": ["./src/*"],
			"react-native": ["../../node_modules/react-native"],
		});
	});
});
