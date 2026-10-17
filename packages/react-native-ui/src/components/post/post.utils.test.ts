import { describe, expect, test } from "bun:test";
import {
	type BodyToken,
	formatCompactCount,
	formatGroupedNumber,
	formatRelativeTime,
	resolveAuthorA11yLabel,
	resolveBodyClamp,
	resolvePostStatLabel,
	resolveVotesLabel,
	tokenizePostBody,
} from "./post.utils";

describe("formatCompactCount", () => {
	test.each([
		[0, "0"],
		[7, "7"],
		[999, "999"],
		[1000, "1K"],
		[1234, "1.2K"],
		[1250, "1.3K"],
		[9999, "10K"],
		[12_345, "12K"],
		[999_499, "999K"],
		[999_999, "1M"],
		[1_500_000, "1.5M"],
		[2_000_000_000, "2B"],
		[-5, "-5"],
		[-1234, "-1.2K"],
	])("%p -> %p", (input, expected) => {
		expect(formatCompactCount(input)).toBe(expected);
	});

	test("a fractional count below a thousand rounds to a whole number", () => {
		expect(formatCompactCount(12.6)).toBe("13");
	});

	test("NaN and the infinities print 0", () => {
		expect(formatCompactCount(Number.NaN)).toBe("0");
		expect(formatCompactCount(Number.POSITIVE_INFINITY)).toBe("0");
		expect(formatCompactCount(Number.NEGATIVE_INFINITY)).toBe("0");
	});
});

describe("formatGroupedNumber", () => {
	test.each([
		[0, "0"],
		[999, "999"],
		[1234, "1,234"],
		[1_240_000, "1,240,000"],
		[-1234, "-1,234"],
	])("%p -> %p", (input, expected) => {
		expect(formatGroupedNumber(input)).toBe(expected);
	});

	test("NaN prints 0", () => {
		expect(formatGroupedNumber(Number.NaN)).toBe("0");
	});
});

describe("formatRelativeTime", () => {
	const now = new Date(2026, 9, 5, 12, 0, 0);
	const ago = (ms: number) => new Date(now.getTime() - ms);
	const SECOND = 1000;
	const MINUTE = 60 * SECOND;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;

	test("under a minute is now", () => {
		expect(formatRelativeTime(ago(30 * SECOND), now)).toEqual({ short: "now", spoken: "just now" });
		expect(formatRelativeTime(ago(59 * SECOND), now)).toEqual({ short: "now", spoken: "just now" });
	});

	test("minutes", () => {
		expect(formatRelativeTime(ago(3 * MINUTE), now)).toEqual({ short: "3m", spoken: "3 minutes ago" });
		expect(formatRelativeTime(ago(MINUTE), now)).toEqual({ short: "1m", spoken: "1 minute ago" });
	});

	test("hours, floored", () => {
		expect(formatRelativeTime(ago(HOUR), now)).toEqual({ short: "1h", spoken: "1 hour ago" });
		expect(formatRelativeTime(ago(23 * HOUR + 59 * MINUTE), now).short).toBe("23h");
	});

	test("days, below a week", () => {
		expect(formatRelativeTime(ago(2 * DAY), now)).toEqual({ short: "2d", spoken: "2 days ago" });
		expect(formatRelativeTime(ago(6 * DAY), now).short).toBe("6d");
	});

	test("a week or more prints the date, with the year only when it differs", () => {
		expect(formatRelativeTime(new Date(2026, 8, 20, 9), now)).toEqual({
			short: "Sep 20",
			spoken: "September 20",
		});
		expect(formatRelativeTime(new Date(2025, 9, 5, 9), now)).toEqual({
			short: "Oct 5, 2025",
			spoken: "October 5, 2025",
		});
	});

	test("a future date reads as now — clock skew never prints a negative", () => {
		expect(formatRelativeTime(new Date(now.getTime() + 3 * MINUTE), now)).toEqual({
			short: "now",
			spoken: "just now",
		});
	});

	test("an invalid date prints nothing", () => {
		expect(formatRelativeTime(new Date(Number.NaN), now)).toEqual({ short: "", spoken: "" });
	});
});

/** Rebuilds the source string, which every tokenisation must allow. */
function roundTrip(tokens: BodyToken[]): string {
	return tokens.map((token) => (token.type === "text" ? token.value : token.raw)).join("");
}

describe("tokenizePostBody", () => {
	test("an empty body has no tokens", () => {
		expect(tokenizePostBody("")).toEqual([]);
	});

	test("a tag after whitespace", () => {
		expect(tokenizePostBody("Hi #tag")).toEqual([
			{ type: "text", value: "Hi " },
			{ type: "tag", value: "tag", raw: "#tag" },
		]);
	});

	test("no tag mid-word", () => {
		expect(tokenizePostBody("a#b")).toEqual([{ type: "text", value: "a#b" }]);
	});

	test("a tag ends at the next #", () => {
		expect(tokenizePostBody("#a#b")).toEqual([
			{ type: "tag", value: "a", raw: "#a" },
			{ type: "text", value: "#b" },
		]);
	});

	test("a tag needs a letter", () => {
		expect(tokenizePostBody("#123")).toEqual([{ type: "text", value: "#123" }]);
		expect(tokenizePostBody("#v2")).toEqual([{ type: "tag", value: "v2", raw: "#v2" }]);
	});

	test("a tag takes unicode letters", () => {
		expect(tokenizePostBody("#Café")).toEqual([{ type: "tag", value: "Café", raw: "#Café" }]);
	});

	test("a mention stops at punctuation", () => {
		expect(tokenizePostBody("@aria,")).toEqual([
			{ type: "mention", value: "aria", raw: "@aria" },
			{ type: "text", value: "," },
		]);
	});

	test("an email address is not a mention", () => {
		expect(tokenizePostBody("email@x.com")).toEqual([{ type: "text", value: "email@x.com" }]);
	});

	test("a link drops its trailing punctuation", () => {
		expect(tokenizePostBody("https://x.dev/a?b=1.")).toEqual([
			{ type: "link", value: "https://x.dev/a?b=1", raw: "https://x.dev/a?b=1" },
			{ type: "text", value: "." },
		]);
	});

	test("a link in brackets", () => {
		expect(tokenizePostBody("(see http://a.io)")).toEqual([
			{ type: "text", value: "(see " },
			{ type: "link", value: "http://a.io", raw: "http://a.io" },
			{ type: "text", value: ")" },
		]);
	});

	test("adjacent text is merged into one run", () => {
		const tokens = tokenizePostBody("a # b @ c");
		expect(tokens).toEqual([{ type: "text", value: "a # b @ c" }]);
	});

	test("every body round-trips", () => {
		for (const body of [
			"Shipping #ReactNative today with @aria and @lena. Notes: https://x.dev/notes!",
			"#a#b @c@d e#f",
			"line one\n#tag on line two",
			"  leading space and trailing  ",
			"🎉 #party 🎉",
		]) {
			expect(roundTrip(tokenizePostBody(body))).toBe(body);
		}
	});
});

describe("resolvePostStatLabel", () => {
	test("noun and number together", () => {
		expect(resolvePostStatLabel("Like", 216, false)).toBe("Like, 216");
	});

	test("the raw number is grouped, never compacted", () => {
		expect(resolvePostStatLabel("Like", 1234, true)).toBe("Like, 1,234");
	});

	test("a string value equal to the label is not repeated", () => {
		expect(resolvePostStatLabel("Save", "Save", false)).toBe("Save");
	});

	test("a different string value is appended", () => {
		expect(resolvePostStatLabel("Views", "1.2K", false)).toBe("Views, 1.2K");
	});

	test("no value is the noun alone", () => {
		expect(resolvePostStatLabel("Views", undefined, false)).toBe("Views");
	});
});

describe("resolveVotesLabel", () => {
	test("groups a number", () => {
		expect(resolveVotesLabel(1240)).toBe("Score 1,240");
	});

	test("passes a string through", () => {
		expect(resolveVotesLabel("Vote")).toBe("Score Vote");
	});
});

describe("resolveAuthorA11yLabel", () => {
	test("name, handle, verified and the spoken time", () => {
		expect(resolveAuthorA11yLabel({ name: "Aria", handle: "@aria", verified: true, spokenTime: "3 minutes ago" })).toBe(
			"Aria, @aria, verified, 3 minutes ago"
		);
	});

	test("drops what is missing", () => {
		expect(resolveAuthorA11yLabel({ name: "Aria", verified: false, spokenTime: "" })).toBe("Aria");
	});
});

describe("resolveBodyClamp", () => {
	test("not expandable never offers a toggle", () => {
		expect(resolveBodyClamp({ numberOfLines: 3, expandable: false, isTruncated: true, isExpanded: false })).toEqual({
			numberOfLines: 3,
			showMore: false,
			showLess: false,
		});
	});

	test("truncated and collapsed offers more", () => {
		expect(resolveBodyClamp({ numberOfLines: 3, expandable: true, isTruncated: true, isExpanded: false })).toEqual({
			numberOfLines: 3,
			showMore: true,
			showLess: false,
		});
	});

	test("expanded drops the clamp and offers less", () => {
		expect(resolveBodyClamp({ numberOfLines: 3, expandable: true, isTruncated: true, isExpanded: true })).toEqual({
			numberOfLines: undefined,
			showMore: false,
			showLess: true,
		});
	});

	test("a short body offers nothing", () => {
		expect(resolveBodyClamp({ numberOfLines: 3, expandable: true, isTruncated: false, isExpanded: false })).toEqual({
			numberOfLines: 3,
			showMore: false,
			showLess: false,
		});
	});

	test("no clamp offers nothing", () => {
		expect(resolveBodyClamp({ expandable: true, isTruncated: false, isExpanded: false })).toEqual({
			numberOfLines: undefined,
			showMore: false,
			showLess: false,
		});
	});
});
