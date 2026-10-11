import { describe, expect, test } from "bun:test";
import { flowTypes } from "./plan";

describe("flowTypes", () => {
	test("is true for a flow with a keyboard step", () => {
		const flow = [
			"steps:",
			"  - tap: { id: field }",
			"  - tool: keyboard",
			'    args: { text: "ada", delayMs: 60 }',
		].join("\n");
		expect(flowTypes(flow)).toBe(true);
	});

	test("is false for a flow that only taps, swipes and waits", () => {
		const flow = ["steps:", "  - tap: { id: switch-md }", "  - wait: 500", "  - tool: gesture-custom"].join("\n");
		expect(flowTypes(flow)).toBe(false);
	});

	test("ignores the word in prose", () => {
		const flow = [
			"executionPrerequisite: The keyboard is down.",
			"steps:",
			"  - echo: tool: keyboard is not used",
		].join("\n");
		expect(flowTypes(flow)).toBe(false);
	});
});
