import { describe, expect, test } from "bun:test";
import { err, ok } from "./result";

describe("Result", () => {
	test("ok wraps a value", () => {
		expect(ok(3)).toEqual({ success: true, data: 3 });
	});

	test("err keeps a typed error rather than flattening it to a string", () => {
		expect(err({ code: "invalid-snap-point" as const })).toEqual({
			success: false,
			error: { code: "invalid-snap-point" },
		});
	});
});
