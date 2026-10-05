import { describe, expect, test } from "bun:test";
import { isPresent, type PresencePhase, presenceTarget, reducePresence } from "./overlay-presence";

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
