import { describe, expect, test } from "bun:test";
import { classifyScrollHandler } from "./screen-scroll-handler";

describe("classifyScrollHandler", () => {
	test("nothing supplied is none", () => {
		expect(classifyScrollHandler(undefined)).toEqual({ kind: "none" });
		expect(classifyScrollHandler(null)).toEqual({ kind: "none" });
	});

	test("a plain function is a JS callback", () => {
		const onScroll = (): void => {};
		expect(classifyScrollHandler(onScroll)).toEqual({ kind: "js", handler: onScroll });
	});

	test("a useAnimatedScrollHandler result is a worklet handler", () => {
		const processed = { workletEventHandler: { eventNames: ["onScroll"] } };
		expect(classifyScrollHandler(processed)).toEqual({ kind: "worklet", handler: processed });
	});

	test("an object without a worklet handler is none", () => {
		expect(classifyScrollHandler({})).toEqual({ kind: "none" });
	});
});
