import { describe, expect, test } from "bun:test";
import { stepFrame, stepOverride } from "./step-transition";

describe("stepFrame", () => {
	test("crossfade fades the incoming in and the outgoing out", () => {
		expect(stepFrame("crossfade", "incoming", "forward", 0.25, 390)).toEqual({ opacity: 0.25, translateX: 0 });
		expect(stepFrame("crossfade", "outgoing", "forward", 0.25, 390)).toEqual({ opacity: 0.75, translateX: 0 });
	});

	test("slide moves the incoming in from the right and the outgoing out to the left when going forward", () => {
		expect(stepFrame("slide", "incoming", "forward", 0, 390)).toEqual({ opacity: 1, translateX: 390 });
		expect(stepFrame("slide", "incoming", "forward", 1, 390)).toEqual({ opacity: 1, translateX: 0 });
		expect(stepFrame("slide", "outgoing", "forward", 0.5, 390)).toEqual({ opacity: 1, translateX: -195 });
	});

	test("slide mirrors when going back", () => {
		expect(stepFrame("slide", "incoming", "back", 0, 390)).toEqual({ opacity: 1, translateX: -390 });
		expect(stepFrame("slide", "outgoing", "back", 1, 390)).toEqual({ opacity: 1, translateX: 390 });
	});

	test("none shows the incoming and hides the outgoing at once", () => {
		expect(stepFrame("none", "incoming", "forward", 0, 390)).toEqual({ opacity: 1, translateX: 0 });
		expect(stepFrame("none", "outgoing", "forward", 0, 390)).toEqual({ opacity: 0, translateX: 0 });
	});

	test("an unmeasured width slides nothing rather than off to minus one", () => {
		expect(stepFrame("slide", "incoming", "forward", 0, -1)).toEqual({ opacity: 1, translateX: 0 });
	});
});

describe("stepOverride", () => {
	test("a step with nothing declared overrides nothing", () => {
		expect(stepOverride({})).toEqual({ snapPoints: undefined, dismissible: undefined });
	});

	test("a step's snapPoints and dismissible are surfaced as the override", () => {
		expect(stepOverride({ snapPoints: ["35%"], dismissible: false })).toEqual({
			snapPoints: ["35%"],
			dismissible: false,
		});
	});

	test("an explicit dismissible: true is kept, not collapsed to undefined", () => {
		expect(stepOverride({ dismissible: true })).toEqual({ snapPoints: undefined, dismissible: true });
	});
});
