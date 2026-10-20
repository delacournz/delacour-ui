import { describe, expect, test } from "bun:test";
import { convertFlow, renderSpec } from "./convert-flows";

const steps = (...lines: string[]): string => ["steps:", ...lines.map((line) => `  - ${line}`)].join("\n");

describe("convertFlow", () => {
	test("taps by id, waits and keeps echoes as comments", () => {
		const flow = convertFlow(
			steps("echo: Walking across", "tap: { id: primary-activity }", "wait: 600", "tap: { text: Undo }")
		);
		expect(flow.types).toBe(false);
		expect(flow.warnings).toEqual([]);
		expect(flow.lines).toEqual([
			"// Walking across",
			'await f.tap("primary-activity");',
			"await f.wait(600);",
			'await f.tapText("Undo");',
		]);
	});

	test("turns a swipe by a screen fraction into a swipe from a target", () => {
		const flow = convertFlow(
			steps(
				"swipe: { from: { id: slider-thumb }, by: { x: 0.4 }, momentum: false, duration: 700 }",
				"swipe: { from: { text: Nearby }, by: { y: -0.3 }, duration: 300 }",
				"swipe: { from: { x: 0.5, y: 0.7 }, by: { y: -0.35 } }"
			)
		);
		expect(flow.lines).toEqual([
			'await f.swipe({ id: "slider-thumb" }, { x: 0.4 }, { durationMs: 700, momentum: false });',
			'await f.swipe({ text: "Nearby" }, { y: -0.3 }, { durationMs: 300 });',
			"await f.swipe({ x: 0.5, y: 0.7 }, { y: -0.35 });",
		]);
	});

	test("long-press, await and assert", () => {
		const flow = convertFlow(
			steps(
				"long-press: { on: { id: message-m2 }, duration: 700 }",
				"await: { visible: { id: channel-design } }",
				"await: { hidden: { text: Harbour Studio }, timeout: 8000 }",
				"await: { visible: { text: { matches: '^Row 1$' } } }",
				"await: { text: { in: { id: inline-readout }, contains: Snap point 2 of 2 } }",
				"assert: { visible: { text: Nearby } }"
			)
		);
		expect(flow.lines).toEqual([
			'await f.longPress("message-m2", 700);',
			'await f.visible({ id: "channel-design" });',
			'await f.hidden({ text: "Harbour Studio" }, { timeout: 8000 });',
			'await f.visible({ matches: "^Row 1$" });',
			'await f.containsText("inline-readout", "Snap point 2 of 2");',
			'await f.visible({ text: "Nearby" });',
		]);
	});

	test("keyboard steps type into the field the flow last tapped, and mark the flow as typing", () => {
		const flow = convertFlow(
			[
				"steps:",
				"  - tap: { id: input-primary }",
				"  - tool: keyboard",
				"    args: { text: Ada, delayMs: 120 }",
				"  - tap: { id: input-secondary }",
				"  - tool: keyboard",
				"    args: { key: backspace }",
				"  - tool: keyboard",
				"    args: { key: backspace }",
				"  - tool: keyboard",
				"    args: { key: enter }",
				"  - type: { into: { id: steps-form-name }, text: Ada, submit: false }",
			].join("\n")
		);
		expect(flow.types).toBe(true);
		expect(flow.lines).toEqual([
			'await f.tap("input-primary");',
			'await f.type("input-primary", "Ada");',
			'await f.tap("input-secondary");',
			'await f.press("input-secondary", "Backspace", 2);',
			'await f.press("input-secondary", "Enter");',
			'await f.type("steps-form-name", "Ada");',
		]);
	});

	test("a keyboard step with no field to send it to is a warning", () => {
		const flow = convertFlow(`steps:\n  - tool: keyboard\n    args: { key: enter }`);
		expect(flow.warnings.length).toBe(1);
		expect(flow.lines[0]).toContain("FIXME");
	});

	test("gesture-tap taps a normalized point", () => {
		const flow = convertFlow(`steps:\n  - tool: gesture-tap\n    args: { x: 0.66, y: 0.47 }`);
		expect(flow.lines).toEqual(["await f.tapAt(0.66, 0.47);"]);
	});

	test("consecutive gesture-custom steps merge into one down-to-up path", () => {
		const flow = convertFlow(
			[
				"steps:",
				"  - tool: gesture-custom",
				"    args:",
				"      interpolate: 6",
				"      events:",
				"        - { type: Down, x: 0.22, y: 0.5 }",
				"        - { type: Move, x: 0.45, y: 0.5, delayMs: 500 }",
				"  - echo: And back",
				"  - tool: gesture-custom",
				"    args:",
				"      interpolate: 6",
				"      events:",
				"        - { type: Move, x: 0.23, y: 0.5, delayMs: 220 }",
				"        - { type: Up, x: 0.22, y: 0.5, delayMs: 160 }",
			].join("\n")
		);
		expect(flow.lines).toEqual([
			"// And back",
			"await f.gesture(",
			"\t[",
			'\t\t{ type: "down", x: 0.22, y: 0.5 },',
			'\t\t{ type: "move", x: 0.45, y: 0.5, delayMs: 500 },',
			'\t\t{ type: "move", x: 0.23, y: 0.5, delayMs: 220 },',
			'\t\t{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },',
			"\t],",
			"\t{ interpolate: 6 }",
			");",
		]);
	});

	test("an unknown step is a warning, not silence", () => {
		const flow = convertFlow("steps:\n  - launch: { bundleId: x }");
		expect(flow.warnings.length).toBe(1);
		expect(flow.lines[0]).toContain("FIXME");
	});
});

describe("renderSpec", () => {
	test("one capture per demo, stills first-class, flows with a body", () => {
		const spec = renderSpec("accordion", [
			{ id: "accordion/variants", flow: { lines: ['await f.tap("x");'], types: false, warnings: [] } },
			{ id: "accordion/sizes" },
			{ id: "accordion/typed", flow: { lines: ['await f.type("a", "b");'], types: true, warnings: [] } },
		]);
		expect(spec).toContain('import { capture } from "./capture";');
		expect(spec).toContain('capture("accordion/variants", async (f) => {\n\tawait f.tap("x");\n});');
		expect(spec).toContain('capture("accordion/sizes");');
		expect(spec).toContain('capture("accordion/typed", { types: true }, async (f) => {');
	});
});
