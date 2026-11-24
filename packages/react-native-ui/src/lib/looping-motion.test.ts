import { describe, expect, test } from "bun:test";
import { DELACOUR_DEFAULT_LABELS } from "./labels";
import {
	LOOPING_MOTION_ACTION,
	resolveLoopingMotion,
	resolveLoopingMotionActions,
	resolveLoopingMotionToggleLabel,
} from "./looping-motion";

const labels = DELACOUR_DEFAULT_LABELS.motion;

describe("resolveLoopingMotion", () => {
	test("moves when nothing holds it", () => {
		expect(resolveLoopingMotion({ isCalm: false, isScreenReader: false, isPaused: false })).toEqual({
			hold: "none",
			isMoving: true,
			isAtRest: false,
		});
	});

	test("calm motion rests the loop, whatever else is true", () => {
		for (const isScreenReader of [false, true]) {
			for (const isPaused of [false, true]) {
				expect(resolveLoopingMotion({ isCalm: true, isScreenReader, isPaused })).toEqual({
					hold: "calm",
					isMoving: false,
					isAtRest: true,
				});
			}
		}
	});

	test("a screen reader rests the loop, over a user pause", () => {
		expect(resolveLoopingMotion({ isCalm: false, isScreenReader: true, isPaused: false }).hold).toBe("screen-reader");
		expect(resolveLoopingMotion({ isCalm: false, isScreenReader: true, isPaused: true })).toEqual({
			hold: "screen-reader",
			isMoving: false,
			isAtRest: true,
		});
	});

	test("a user pause freezes the loop where it is, not at rest", () => {
		expect(resolveLoopingMotion({ isCalm: false, isScreenReader: false, isPaused: true })).toEqual({
			hold: "paused",
			isMoving: false,
			isAtRest: false,
		});
	});
});

describe("resolveLoopingMotionActions", () => {
	test("a moving loop offers pause", () => {
		expect(resolveLoopingMotionActions("none", labels)).toEqual([
			{ name: LOOPING_MOTION_ACTION.pause, label: "Pause animation" },
		]);
	});

	test("only a user pause offers resume", () => {
		expect(resolveLoopingMotionActions("paused", labels)).toEqual([
			{ name: LOOPING_MOTION_ACTION.resume, label: "Resume animation" },
		]);
	});

	test("a loop the system holds offers nothing: there is nothing the user can resume", () => {
		expect(resolveLoopingMotionActions("calm", labels)).toEqual([]);
		expect(resolveLoopingMotionActions("screen-reader", labels)).toEqual([]);
	});

	test("reads translated labels", () => {
		expect(resolveLoopingMotionActions("none", { pause: "Pausieren", resume: "Fortsetzen" })).toEqual([
			{ name: "pause", label: "Pausieren" },
		]);
	});
});

describe("resolveLoopingMotionToggleLabel", () => {
	test("names what pressing it does", () => {
		expect(resolveLoopingMotionToggleLabel("none", labels)).toBe("Pause animation");
		expect(resolveLoopingMotionToggleLabel("paused", labels)).toBe("Resume animation");
	});

	test("a system hold has no toggle to name", () => {
		expect(resolveLoopingMotionToggleLabel("calm", labels)).toBeNull();
		expect(resolveLoopingMotionToggleLabel("screen-reader", labels)).toBeNull();
	});
});
