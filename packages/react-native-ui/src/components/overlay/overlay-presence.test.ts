import { describe, expect, test } from "bun:test";
import { isCurrentFinish, isPresent, type PresencePhase, presenceTarget, reducePresence } from "./overlay-presence";

describe("reducePresence", () => {
	const cases: [PresencePhase, Parameters<typeof reducePresence>[1]["type"], PresencePhase][] = [
		["closed", "open", "entering"],
		["closed", "close", "closed"],
		["closed", "entered", "closed"],
		["closed", "exited", "closed"],
		["entering", "entered", "open"],
		["entering", "close", "exiting"],
		["entering", "open", "entering"],
		["entering", "exited", "entering"],
		["open", "close", "exiting"],
		["open", "open", "open"],
		["open", "entered", "open"],
		["exiting", "exited", "closed"],
		["exiting", "open", "entering"],
		["exiting", "close", "exiting"],
		["exiting", "entered", "exiting"],
	];

	for (const [from, event, to] of cases) {
		test(`${from} + ${event} → ${to}`, () => {
			expect(reducePresence(from, { type: event })).toBe(to);
		});
	}
});

describe("isPresent", () => {
	test("is false only when closed", () => {
		expect(isPresent("closed")).toBe(false);
		expect(isPresent("entering")).toBe(true);
		expect(isPresent("open")).toBe(true);
		expect(isPresent("exiting")).toBe(true);
	});
});

describe("presenceTarget", () => {
	test("animates toward 1 while entering or open, 0 otherwise", () => {
		expect(presenceTarget("entering")).toBe(1);
		expect(presenceTarget("open")).toBe(1);
		expect(presenceTarget("exiting")).toBe(0);
		expect(presenceTarget("closed")).toBe(0);
	});
});

describe("isCurrentFinish", () => {
	test("accepts an entrance finish from the current transition while open is requested", () => {
		expect(isCurrentFinish({ type: "entered", generation: 2 }, { generation: 2, isOpen: true })).toBe(true);
	});

	test("accepts an exit finish from the current transition while close is requested", () => {
		expect(isCurrentFinish({ type: "exited", generation: 2 }, { generation: 2, isOpen: false })).toBe(true);
	});

	test("drops an exit finish once the owner has asked to reopen", () => {
		expect(isCurrentFinish({ type: "exited", generation: 2 }, { generation: 2, isOpen: true })).toBe(false);
	});

	test("drops an entrance finish once the owner has asked to close", () => {
		expect(isCurrentFinish({ type: "entered", generation: 2 }, { generation: 2, isOpen: false })).toBe(false);
	});

	test("drops a finish from an earlier transition", () => {
		expect(isCurrentFinish({ type: "exited", generation: 1 }, { generation: 2, isOpen: false })).toBe(false);
		expect(isCurrentFinish({ type: "entered", generation: 1 }, { generation: 2, isOpen: true })).toBe(false);
	});
});
