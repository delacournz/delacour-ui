import { describe, expect, test } from "bun:test";
import { planKeystrokes, softKeyFor } from "./keystrokes";

describe("planKeystrokes", () => {
	test("a lowercase letter is its own key", () => {
		expect(planKeystrokes("sw")).toEqual([
			{ kind: "letter", label: "s", shifted: false },
			{ kind: "letter", label: "w", shifted: false },
		]);
	});

	test("an uppercase letter is its lowercase key behind shift", () => {
		expect(planKeystrokes("Ur")).toEqual([
			{ kind: "letter", label: "u", shifted: true },
			{ kind: "letter", label: "r", shifted: false },
		]);
	});

	test("a space is the space bar", () => {
		expect(planKeystrokes("a b")).toEqual([
			{ kind: "letter", label: "a", shifted: false },
			{ kind: "space" },
			{ kind: "letter", label: "b", shifted: false },
		]);
	});

	test("anything else is a symbol, found on whichever plane has it", () => {
		expect(planKeystrokes("a@1.")).toEqual([
			{ kind: "letter", label: "a", shifted: false },
			{ kind: "symbol", label: "@" },
			{ kind: "symbol", label: "1" },
			{ kind: "symbol", label: "." },
		]);
	});

	test("an accented letter is a symbol — it has no key of its own", () => {
		expect(planKeystrokes("é")).toEqual([{ kind: "symbol", label: "é" }]);
	});

	test("a surrogate pair stays one keystroke", () => {
		expect(planKeystrokes("😀")).toEqual([{ kind: "symbol", label: "😀" }]);
	});
});

describe("softKeyFor", () => {
	test("Backspace is the delete key", () => {
		expect(softKeyFor("Backspace")).toEqual({ kind: "id", id: "delete" });
	});

	test("Enter is the return key, whatever the field names it", () => {
		const key = softKeyFor("Enter");
		expect(key?.kind).toBe("return");
	});

	test("Space is the space bar", () => {
		expect(softKeyFor("Space")).toEqual({ kind: "id", id: "space" });
	});

	test("a key the soft keyboard does not have is undefined", () => {
		expect(softKeyFor("Tab")).toBeUndefined();
		expect(softKeyFor("Escape")).toBeUndefined();
		expect(softKeyFor("Up")).toBeUndefined();
	});
});
