import { describe, expect, test } from "bun:test";
import { ANDROID_TIMING, IOS_SPRING, selectAnimation } from "./select-animation";

describe("selectAnimation", () => {
	test("iOS defaults to the house spring, reduce motion following the system", () => {
		expect(selectAnimation(undefined, "ios", undefined)).toEqual({ ...IOS_SPRING, reduceMotion: "system" });
		expect(IOS_SPRING).toEqual({
			type: "spring",
			damping: 500,
			stiffness: 1000,
			mass: 3,
			overshootClamping: true,
			restDisplacementThreshold: 10,
			restSpeedThreshold: 10,
		});
	});

	test("Android defaults to a 250ms timing with an exponential ease-out, named not imported", () => {
		expect(selectAnimation(undefined, "android", undefined)).toEqual({ ...ANDROID_TIMING, reduceMotion: "system" });
		expect(ANDROID_TIMING).toEqual({ type: "timing", duration: 250, easing: "outExp" });
	});

	test("any other platform takes the timing — a spring with no native driver is the worse guess", () => {
		expect(selectAnimation(undefined, "web", undefined).type).toBe("timing");
	});

	test("a partial spring fills in the house defaults", () => {
		expect(selectAnimation({ type: "spring", damping: 30 }, "android", undefined)).toEqual({
			...IOS_SPRING,
			damping: 30,
			reduceMotion: "system",
		});
	});

	test("a partial timing fills in the house defaults", () => {
		expect(selectAnimation({ type: "timing", easing: "linear" }, "ios", undefined)).toEqual({
			type: "timing",
			duration: 250,
			easing: "linear",
			reduceMotion: "system",
		});
	});

	test("overrideReduceMotion wins over the system setting", () => {
		expect(selectAnimation(undefined, "ios", "never").reduceMotion).toBe("never");
		expect(selectAnimation({ type: "timing" }, "ios", "always").reduceMotion).toBe("always");
	});

	test("a config's own reduceMotion is kept unless overridden", () => {
		expect(selectAnimation({ type: "spring", reduceMotion: "never" }, "ios", undefined).reduceMotion).toBe("never");
		expect(selectAnimation({ type: "spring", reduceMotion: "never" }, "ios", "always").reduceMotion).toBe("always");
	});

	test("returns a fresh object each time, so a caller may mutate the velocity in", () => {
		expect(selectAnimation(undefined, "ios", undefined)).not.toBe(selectAnimation(undefined, "ios", undefined));
	});
});
