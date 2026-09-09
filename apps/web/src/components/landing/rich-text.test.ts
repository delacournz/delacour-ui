import { describe, expect, test } from "bun:test";
import { plainText } from "./rich-text";

describe("plainText", () => {
	test("strips the two marks and nothing else", () => {
		expect(plainText("Copy `globals.css` across, or a [tweakcn](https://tweakcn.com) export.")).toBe(
			"Copy globals.css across, or a tweakcn export."
		);
	});

	test("leaves a plain sentence alone", () => {
		expect(plainText("Same names. Same palette.")).toBe("Same names. Same palette.");
	});
});
