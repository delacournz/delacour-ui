import { describe, expect, test } from "bun:test";
import {
	commitDraft,
	DEFAULT_REJECT_MESSAGES,
	evaluateAdd,
	ingestText,
	isOverflowing,
	normalizeTag,
	REJECT_HAPTIC_INTERVAL_MS,
	resolveAddAnnouncement,
	resolveBackspace,
	resolveBlur,
	resolveCounterText,
	resolveRejectAnnouncement,
	resolveRemoveAnnouncement,
	resolveTagInputState,
	resolveTagsAccessibilityLabel,
	shouldFireRejectHaptic,
	shouldHideInput,
	splitByDelimiters,
	type TagInputCommitOptions,
} from "./tag-input.logic";

const COMMA: TagInputCommitOptions = { delimiters: [","] };

describe("splitByDelimiters", () => {
	test("commits every piece before the last delimiter and keeps the rest as the draft", () => {
		expect(splitByDelimiters("a,b, c", [","])).toEqual({ pieces: ["a", "b"], remainder: " c" });
	});

	test("a trailing delimiter commits the last piece and leaves nothing", () => {
		expect(splitByDelimiters("a,b,", [","])).toEqual({ pieces: ["a", "b"], remainder: "" });
	});

	test("a pasted list becomes one piece per value", () => {
		expect(splitByDelimiters("a,b,c,", [","]).pieces).toEqual(["a", "b", "c"]);
	});

	test("a leading delimiter commits nothing", () => {
		expect(splitByDelimiters(",a", [","])).toEqual({ pieces: [], remainder: "a" });
	});

	test("a run of space delimiters collapses rather than committing empties", () => {
		expect(splitByDelimiters("a   b ", [" "])).toEqual({ pieces: ["a", "b"], remainder: "" });
	});

	test("pieces are trimmed", () => {
		expect(splitByDelimiters(" a , b ,", [","]).pieces).toEqual(["a", "b"]);
	});

	test("any of several delimiters splits", () => {
		expect(splitByDelimiters("a,b;c d", [",", ";", " "])).toEqual({ pieces: ["a", "b", "c"], remainder: "d" });
	});

	test("a newline always splits, since a one-line field cannot hold one", () => {
		expect(splitByDelimiters("a\nb\n", [","]).pieces).toEqual(["a", "b"]);
	});

	test("text with no delimiter is all remainder", () => {
		expect(splitByDelimiters("hello", [","])).toEqual({ pieces: [], remainder: "hello" });
	});

	test("a multi-character delimiter is ignored, not matched", () => {
		expect(splitByDelimiters("a::b", ["::"])).toEqual({ pieces: [], remainder: "a::b" });
	});

	test("regex metacharacters are delimiters like any other", () => {
		expect(splitByDelimiters("a.b|c", [".", "|"])).toEqual({ pieces: ["a", "b"], remainder: "c" });
	});
});

describe("normalizeTag", () => {
	test("trims both ends", () => {
		expect(normalizeTag("  design  ")).toBe("design");
	});

	test("keeps inner whitespace as typed", () => {
		expect(normalizeTag(" new  york ")).toBe("new  york");
	});

	test("applies the transform after the trim", () => {
		expect(normalizeTag("  Design ", (raw) => `[${raw.toLowerCase()}]`)).toBe("[design]");
	});
});

describe("evaluateAdd", () => {
	test("an empty tag is rejected as empty", () => {
		expect(evaluateAdd("", [], {})).toEqual({ ok: false, reason: "empty" });
	});

	test("a new tag is appended", () => {
		expect(evaluateAdd("b", ["a"], {})).toEqual({ ok: true, tags: ["a", "b"] });
	});

	test("duplicates are caught case-insensitively by default", () => {
		expect(evaluateAdd("Design", ["design"], {})).toEqual({ ok: false, reason: "duplicate" });
	});

	test("caseSensitiveDuplicates tells case apart", () => {
		expect(evaluateAdd("Design", ["design"], { caseSensitiveDuplicates: true })).toEqual({
			ok: true,
			tags: ["design", "Design"],
		});
		expect(evaluateAdd("design", ["design"], { caseSensitiveDuplicates: true })).toEqual({
			ok: false,
			reason: "duplicate",
		});
	});

	test("allowDuplicates accepts a repeat", () => {
		expect(evaluateAdd("a", ["a"], { allowDuplicates: true })).toEqual({ ok: true, tags: ["a", "a"] });
	});

	test("at max the tag is rejected", () => {
		expect(evaluateAdd("c", ["a", "b"], { max: 2 })).toEqual({ ok: false, reason: "max" });
	});

	test("allowOverflow accepts past max", () => {
		expect(evaluateAdd("c", ["a", "b"], { allowOverflow: true, max: 2 })).toEqual({
			ok: true,
			tags: ["a", "b", "c"],
		});
	});

	test("a failed validate is rejected as invalid, and sees the current tags", () => {
		const seen: (readonly string[])[] = [];
		const validate = (tag: string, current: readonly string[]) => {
			seen.push(current);
			return tag.includes("@");
		};
		expect(evaluateAdd("nope", ["a@b.c"], { validate })).toEqual({ ok: false, reason: "invalid" });
		expect(seen).toEqual([["a@b.c"]]);
	});

	test("precedence is empty, duplicate, invalid, max", () => {
		const never = () => false;
		expect(evaluateAdd("", ["a"], { max: 1, validate: never })).toEqual({ ok: false, reason: "empty" });
		expect(evaluateAdd("a", ["a"], { max: 1, validate: never })).toEqual({ ok: false, reason: "duplicate" });
		expect(evaluateAdd("b", ["a"], { max: 1, validate: never })).toEqual({ ok: false, reason: "invalid" });
		expect(evaluateAdd("b", ["a"], { max: 1 })).toEqual({ ok: false, reason: "max" });
	});

	test("never mutates the current list", () => {
		const current = ["a"];
		evaluateAdd("b", current, {});
		expect(current).toEqual(["a"]);
	});
});

describe("commitDraft", () => {
	test("commits the whole draft, remainder included", () => {
		expect(commitDraft("a, b", [], COMMA)).toEqual({ accepted: ["a", "b"], draft: "", rejected: [], tags: ["a", "b"] });
	});

	test("an empty draft is reported as empty", () => {
		expect(commitDraft("   ", ["a"], COMMA)).toEqual({
			accepted: [],
			draft: "",
			rejected: [{ reason: "empty", tag: "" }],
			tags: ["a"],
		});
	});

	test("one rejected piece does not drop the others", () => {
		const result = commitDraft("a, b, a, c", ["b"], COMMA);
		expect(result.tags).toEqual(["b", "a", "c"]);
		expect(result.accepted).toEqual(["a", "c"]);
		expect(result.rejected).toEqual([
			{ reason: "duplicate", tag: "b" },
			{ reason: "duplicate", tag: "a" },
		]);
	});

	test("pieces within one paste are checked against each other", () => {
		expect(commitDraft("x,X", [], COMMA).rejected).toEqual([{ reason: "duplicate", tag: "X" }]);
	});

	test("max is counted as the paste lands", () => {
		const result = commitDraft("a,b,c", [], { ...COMMA, max: 2 });
		expect(result.tags).toEqual(["a", "b"]);
		expect(result.rejected).toEqual([{ reason: "max", tag: "c" }]);
	});

	test("the transform runs on every piece", () => {
		expect(commitDraft("A, B", [], { ...COMMA, transform: (raw) => raw.toLowerCase() }).tags).toEqual(["a", "b"]);
	});

	test("an invalid piece stays in the draft so it can be corrected", () => {
		const validate = (tag: string) => tag.includes("@");
		expect(commitDraft("a@b.c, nope", [], { ...COMMA, validate })).toEqual({
			accepted: ["a@b.c"],
			draft: "nope",
			rejected: [{ reason: "invalid", tag: "nope" }],
			tags: ["a@b.c"],
		});
	});

	test("several invalid pieces stay, joined by the first delimiter", () => {
		const validate = () => false;
		expect(commitDraft("x;y", [], { delimiters: [";", ","], validate }).draft).toBe("x; y");
	});

	test("a space delimiter joins kept pieces with one space", () => {
		const validate = () => false;
		expect(commitDraft("x y", [], { delimiters: [" "], validate }).draft).toBe("x y");
	});
});

describe("ingestText", () => {
	test("text with no delimiter only becomes the draft", () => {
		expect(ingestText("hel", ["a"], COMMA)).toEqual({ accepted: [], draft: "hel", rejected: [], tags: ["a"] });
	});

	test("a typed delimiter commits what came before it", () => {
		expect(ingestText("hello,", [], COMMA)).toEqual({
			accepted: ["hello"],
			draft: "",
			rejected: [],
			tags: ["hello"],
		});
	});

	test("a paste commits every complete piece and leaves the tail as the draft", () => {
		expect(ingestText("a,b,c", [], COMMA)).toEqual({
			accepted: ["a", "b"],
			draft: "c",
			rejected: [],
			tags: ["a", "b"],
		});
	});

	test("a delimiter typed on an empty draft commits nothing and reports nothing", () => {
		expect(ingestText(",", ["a"], COMMA)).toEqual({ accepted: [], draft: "", rejected: [], tags: ["a"] });
	});

	test("an invalid piece is put back ahead of the tail", () => {
		const validate = (tag: string) => tag.includes("@");
		expect(ingestText("nope,ta", [], { ...COMMA, validate }).draft).toBe("nope, ta");
	});

	test("the tail's leading whitespace is dropped once a piece committed before it", () => {
		expect(ingestText("a, b", [], COMMA).draft).toBe("b");
	});
});

describe("resolveBackspace", () => {
	test("does nothing while there is text", () => {
		expect(resolveBackspace({ draft: "a", isArmed: false, tagCount: 2 })).toEqual({ type: "none" });
		expect(resolveBackspace({ draft: "a", isArmed: true, tagCount: 2 })).toEqual({ type: "none" });
	});

	test("does nothing with no tags", () => {
		expect(resolveBackspace({ draft: "", isArmed: false, tagCount: 0 })).toEqual({ type: "none" });
	});

	test("the first press arms the last tag", () => {
		expect(resolveBackspace({ draft: "", isArmed: false, tagCount: 3 })).toEqual({ index: 2, type: "arm" });
	});

	test("the second press removes it", () => {
		expect(resolveBackspace({ draft: "", isArmed: true, tagCount: 3 })).toEqual({ index: 2, type: "remove" });
	});
});

describe("resolveBlur", () => {
	test("add commits a non-empty draft", () => {
		expect(resolveBlur("add", "a")).toBe("commit");
	});

	test("add with an empty draft does nothing, and never reports empty", () => {
		expect(resolveBlur("add", "  ")).toBe("none");
	});

	test("clear empties a non-empty draft", () => {
		expect(resolveBlur("clear", "a")).toBe("clear");
		expect(resolveBlur("clear", "")).toBe("none");
	});

	test("keep leaves it", () => {
		expect(resolveBlur("keep", "a")).toBe("none");
	});
});

describe("counting", () => {
	test("overflow is past max, not at it", () => {
		expect(isOverflowing({ count: 2, max: 2 })).toBe(false);
		expect(isOverflowing({ count: 3, max: 2 })).toBe(true);
		expect(isOverflowing({ count: 30 })).toBe(false);
	});

	test("the counter reads n/max, or n with no max", () => {
		expect(resolveCounterText(3, 10)).toBe("3/10");
		expect(resolveCounterText(3)).toBe("3");
	});
});

describe("shouldHideInput", () => {
	const base = { allowOverflow: false, count: 0, isDisabled: false, isReadOnly: false };

	test("shows by default", () => {
		expect(shouldHideInput(base)).toBe(false);
	});

	test("read-only always hides it", () => {
		expect(shouldHideInput({ ...base, isReadOnly: true })).toBe(true);
	});

	test("at max it hides, unless overflow is allowed", () => {
		expect(shouldHideInput({ ...base, count: 2, max: 2 })).toBe(true);
		expect(shouldHideInput({ ...base, allowOverflow: true, count: 2, max: 2 })).toBe(false);
		expect(shouldHideInput({ ...base, count: 1, max: 2 })).toBe(false);
	});

	test("disabled hides it once there are tags, and keeps the placeholder when there are none", () => {
		expect(shouldHideInput({ ...base, count: 1, isDisabled: true })).toBe(true);
		expect(shouldHideInput({ ...base, isDisabled: true })).toBe(false);
	});
});

describe("shouldFireRejectHaptic", () => {
	test("fires the first time", () => {
		expect(shouldFireRejectHaptic(null, 1000)).toBe(true);
	});

	test("holds off inside the interval and fires again after it", () => {
		expect(shouldFireRejectHaptic(1000, 1000 + REJECT_HAPTIC_INTERVAL_MS - 1)).toBe(false);
		expect(shouldFireRejectHaptic(1000, 1000 + REJECT_HAPTIC_INTERVAL_MS)).toBe(true);
	});

	test("the interval is 400ms", () => {
		expect(REJECT_HAPTIC_INTERVAL_MS).toBe(400);
	});
});

describe("announcements", () => {
	test("add and remove name the tag", () => {
		expect(resolveAddAnnouncement("alice")).toBe("Added alice");
		expect(resolveRemoveAnnouncement("alice")).toBe("Removed alice");
	});

	test("every reason has a default message", () => {
		for (const reason of ["duplicate", "max", "invalid", "empty"] as const) {
			expect(DEFAULT_REJECT_MESSAGES[reason].length).toBeGreaterThan(0);
		}
	});

	test("a rejection reads the default, or the caller's override", () => {
		expect(resolveRejectAnnouncement("duplicate")).toBe(DEFAULT_REJECT_MESSAGES.duplicate);
		expect(resolveRejectAnnouncement("max", { max: "Ten at most" })).toBe("Ten at most");
		expect(resolveRejectAnnouncement("invalid", { max: "Ten at most" })).toBe(DEFAULT_REJECT_MESSAGES.invalid);
	});

	test("the tag group is labelled by its count", () => {
		expect(resolveTagsAccessibilityLabel(0)).toBe("No tags");
		expect(resolveTagsAccessibilityLabel(1)).toBe("1 tag");
		expect(resolveTagsAccessibilityLabel(3)).toBe("3 tags");
	});
});

describe("resolveTagInputState", () => {
	const base = {
		allowOverflow: false,
		count: 2,
		field: null,
		isArmed: false,
		isDisabled: undefined,
		isInvalid: undefined,
		isReadOnly: false,
		max: undefined,
	};

	test("own props win over the field, which wins over the defaults", () => {
		expect(resolveTagInputState(base)).toMatchObject({ isDisabled: false, isInvalid: false });
		const field = { isDisabled: true, isInvalid: true };
		expect(resolveTagInputState({ ...base, field })).toMatchObject({ isDisabled: true, isInvalid: true });
		expect(resolveTagInputState({ ...base, field, isDisabled: false, isInvalid: false })).toMatchObject({
			isDisabled: false,
			isInvalid: false,
		});
	});

	test("overflowing max is invalid whatever the props say", () => {
		const state = resolveTagInputState({ ...base, allowOverflow: true, count: 4, isInvalid: false, max: 3 });
		expect(state).toMatchObject({ isHidden: false, isInvalid: true, isOverflowing: true });
	});

	test("arming marks the last tag, and only when there is one", () => {
		expect(resolveTagInputState({ ...base, isArmed: true }).pendingRemoveIndex).toBe(1);
		expect(resolveTagInputState({ ...base, count: 0, isArmed: true }).pendingRemoveIndex).toBeNull();
		expect(resolveTagInputState(base).pendingRemoveIndex).toBeNull();
	});

	test("hides the field by shouldHideInput's rules, on the resolved disabled state", () => {
		expect(resolveTagInputState({ ...base, field: { isDisabled: true, isInvalid: false } }).isHidden).toBe(true);
		expect(resolveTagInputState({ ...base, count: 3, max: 3 }).isHidden).toBe(true);
		expect(resolveTagInputState({ ...base, isReadOnly: true }).isHidden).toBe(true);
		expect(resolveTagInputState(base).isHidden).toBe(false);
	});
});
