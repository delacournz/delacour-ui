import { describe, expect, test } from "bun:test";
import { formatStatCount, resolvePageHeaderAvatarLabel, resolveStatLabel } from "./page-header.utils";

describe("formatStatCount", () => {
	test("draws a number under a thousand as it is", () => {
		expect(formatStatCount(0)).toBe("0");
		expect(formatStatCount(7)).toBe("7");
		expect(formatStatCount(999)).toBe("999");
	});

	test("compacts thousands to one decimal, dropping a trailing zero", () => {
		expect(formatStatCount(1000)).toBe("1K");
		expect(formatStatCount(1234)).toBe("1.2K");
		expect(formatStatCount(12_500)).toBe("12.5K");
		expect(formatStatCount(999_949)).toBe("999.9K");
	});

	test("rounds up across a unit boundary rather than drawing 1000K", () => {
		expect(formatStatCount(999_950)).toBe("1M");
		expect(formatStatCount(999_999)).toBe("1M");
	});

	test("compacts millions and billions", () => {
		expect(formatStatCount(1_250_000)).toBe("1.3M");
		expect(formatStatCount(1_150_000)).toBe("1.2M");
		expect(formatStatCount(3_000_000_000)).toBe("3B");
	});

	test("rounds a fraction to a whole count", () => {
		expect(formatStatCount(4.4)).toBe("4");
		expect(formatStatCount(999.6)).toBe("1K");
	});

	test("never draws a negative count", () => {
		expect(formatStatCount(-5)).toBe("0");
	});

	test("draws a dash for a number that is not a count", () => {
		expect(formatStatCount(Number.NaN)).toBe("–");
		expect(formatStatCount(Number.POSITIVE_INFINITY)).toBe("–");
		expect(formatStatCount(Number.NEGATIVE_INFINITY)).toBe("–");
	});
});

describe("resolveStatLabel", () => {
	test("speaks a number in full, grouped, never compacted", () => {
		expect(resolveStatLabel(1234, "Followers")).toBe("1,234 Followers");
		expect(resolveStatLabel(1_250_000, "Plays")).toBe("1,250,000 Plays");
	});

	test("speaks a string as given", () => {
		expect(resolveStatLabel("Top 5", "Rank")).toBe("Top 5 Rank");
	});

	test("speaks the label alone when there is no value worth reading", () => {
		expect(resolveStatLabel(Number.NaN, "Posts")).toBe("Posts");
		expect(resolveStatLabel("  ", "Posts")).toBe("Posts");
	});
});

describe("resolvePageHeaderAvatarLabel", () => {
	test("appends verified to the name", () => {
		expect(resolvePageHeaderAvatarLabel("Kate", true)).toBe("Kate, verified");
	});

	test("says verified alone with no name", () => {
		expect(resolvePageHeaderAvatarLabel(undefined, true)).toBe("Verified");
		expect(resolvePageHeaderAvatarLabel("  ", true)).toBe("Verified");
	});

	test("leaves an unverified name alone", () => {
		expect(resolvePageHeaderAvatarLabel("Kate", false)).toBe("Kate");
	});

	test("is undefined with neither, so the avatar stays unannounced", () => {
		expect(resolvePageHeaderAvatarLabel(undefined, false)).toBeUndefined();
	});
});
