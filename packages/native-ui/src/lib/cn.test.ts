import { describe, expect, test } from "bun:test";
import { cn } from "./cn";

describe("cn", () => {
	test("joins plain class strings", () => {
		expect(cn("px-2", "py-1")).toBe("px-2 py-1");
	});

	test("drops falsy values", () => {
		expect(cn("px-2", false, null, undefined, "", "py-1")).toBe("px-2 py-1");
	});

	test("resolves conditional objects and arrays", () => {
		expect(cn(["px-2", { "py-1": true, "py-4": false }])).toBe("px-2 py-1");
	});

	test("last conflicting utility wins", () => {
		expect(cn("p-2", "p-6")).toBe("p-6");
		expect(cn("bg-primary", "bg-destructive")).toBe("bg-destructive");
	});

	test("keeps non-conflicting utilities from the same group", () => {
		expect(cn("px-2", "py-4")).toBe("px-2 py-4");
	});

	test("an incoming className overrides the base", () => {
		expect(cn("rounded-lg bg-primary", "bg-secondary")).toBe("rounded-lg bg-secondary");
	});

	test("returns an empty string for no input", () => {
		expect(cn()).toBe("");
	});
});
