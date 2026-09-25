import { describe, expect, test } from "bun:test";
import {
	resolveAvatarAccessibilityLabel,
	resolveAvatarGroup,
	resolveAvatarInitials,
	resolveAvatarOverflowLabel,
	resolveAvatarShowsImage,
	resolveAvatarSourceKey,
} from "./avatar.utils";

describe("resolveAvatarInitials", () => {
	test("takes the first letter of the first and last words", () => {
		expect(resolveAvatarInitials("Kate Austen")).toBe("KA");
		expect(resolveAvatarInitials("Mary Jane Watson")).toBe("MW");
	});

	test("a single word gives a single letter", () => {
		expect(resolveAvatarInitials("Cher")).toBe("C");
	});

	test("uppercases, and ignores surrounding and repeated whitespace", () => {
		expect(resolveAvatarInitials("  oliver   lee ")).toBe("OL");
		expect(resolveAvatarInitials("ada\tlovelace")).toBe("AL");
	});

	test("is empty for an empty, blank or missing name", () => {
		expect(resolveAvatarInitials("")).toBe("");
		expect(resolveAvatarInitials("   ")).toBe("");
		expect(resolveAvatarInitials(undefined)).toBe("");
	});

	test("never splits a letter outside the basic plane", () => {
		// A naive `word[0]` would take half of a surrogate pair and draw a box.
		expect(resolveAvatarInitials("𝒜da 𝒵ed")).toBe("𝒜𝒵");
	});

	test("keeps letters in scripts with no case", () => {
		expect(resolveAvatarInitials("李 小龍")).toBe("李小");
	});

	test("skips a leading punctuation mark in a word", () => {
		expect(resolveAvatarInitials("(Kate) 'Austen'")).toBe("KA");
	});
});

describe("resolveAvatarSourceKey", () => {
	test("is null for no source", () => {
		expect(resolveAvatarSourceKey(undefined)).toBeNull();
		expect(resolveAvatarSourceKey(null)).toBeNull();
	});

	test("is null for a uri that is empty", () => {
		expect(resolveAvatarSourceKey({ uri: "" })).toBeNull();
		expect(resolveAvatarSourceKey({})).toBeNull();
	});

	test("names a bundled asset by its module id", () => {
		expect(resolveAvatarSourceKey(12)).toBe("asset:12");
	});

	test("changes when the uri changes", () => {
		expect(resolveAvatarSourceKey({ uri: "https://a.test/1.png" })).not.toBe(
			resolveAvatarSourceKey({ uri: "https://a.test/2.png" })
		);
	});

	test("changes when only the request headers change", () => {
		// A token refresh is a retry, so it has to clear an earlier failure.
		expect(resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { Authorization: "a" } })).not.toBe(
			resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { Authorization: "b" } })
		);
	});

	test("is stable across renders for an equal source", () => {
		expect(resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { a: "1", b: "2" } })).toBe(
			resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { b: "2", a: "1" } })
		);
	});

	test("reads every entry of a multi-resolution list", () => {
		expect(resolveAvatarSourceKey([{ uri: "https://a.test/1x.png" }, { uri: "https://a.test/2x.png" }])).toBe(
			"uri:https://a.test/1x.png|uri:https://a.test/2x.png"
		);
		expect(resolveAvatarSourceKey([])).toBeNull();
	});
});

describe("resolveAvatarShowsImage", () => {
	test("shows an image that has not failed", () => {
		expect(resolveAvatarShowsImage({ sourceKey: "uri:a", failedKey: null })).toBe(true);
	});

	test("hides one that failed", () => {
		expect(resolveAvatarShowsImage({ sourceKey: "uri:a", failedKey: "uri:a" })).toBe(false);
	});

	test("retries a new source after an earlier one failed", () => {
		expect(resolveAvatarShowsImage({ sourceKey: "uri:b", failedKey: "uri:a" })).toBe(true);
	});

	test("never shows an image with no source", () => {
		expect(resolveAvatarShowsImage({ sourceKey: null, failedKey: null })).toBe(false);
	});
});

describe("resolveAvatarGroup", () => {
	test("shows every child when nothing caps it", () => {
		expect(resolveAvatarGroup({ count: 4 })).toEqual({ visible: 4, overflow: 0 });
	});

	test("max caps the faces, not the row", () => {
		expect(resolveAvatarGroup({ count: 5, max: 3 })).toEqual({ visible: 3, overflow: 2 });
	});

	test("a max at or above the count adds no overflow", () => {
		expect(resolveAvatarGroup({ count: 3, max: 3 })).toEqual({ visible: 3, overflow: 0 });
		expect(resolveAvatarGroup({ count: 3, max: 10 })).toEqual({ visible: 3, overflow: 0 });
	});

	test("total counts the people who were never passed as children", () => {
		expect(resolveAvatarGroup({ count: 3, total: 40 })).toEqual({ visible: 3, overflow: 37 });
	});

	test("max and total compose", () => {
		expect(resolveAvatarGroup({ count: 5, max: 3, total: 40 })).toEqual({ visible: 3, overflow: 37 });
	});

	test("a total below the count is ignored rather than going negative", () => {
		expect(resolveAvatarGroup({ count: 5, total: 2 })).toEqual({ visible: 5, overflow: 0 });
	});

	test("a negative, fractional or non-finite max is clamped", () => {
		expect(resolveAvatarGroup({ count: 5, max: -1 })).toEqual({ visible: 0, overflow: 5 });
		expect(resolveAvatarGroup({ count: 5, max: 2.7 })).toEqual({ visible: 2, overflow: 3 });
		expect(resolveAvatarGroup({ count: 5, max: Number.NaN })).toEqual({ visible: 5, overflow: 0 });
	});

	test("a non-finite total is ignored", () => {
		expect(resolveAvatarGroup({ count: 2, total: Number.POSITIVE_INFINITY })).toEqual({ visible: 2, overflow: 0 });
	});

	test("an empty group is empty", () => {
		expect(resolveAvatarGroup({ count: 0 })).toEqual({ visible: 0, overflow: 0 });
	});
});

describe("resolveAvatarOverflowLabel", () => {
	test("draws a plus and the count", () => {
		expect(resolveAvatarOverflowLabel(2)).toEqual({ text: "+2", accessibilityLabel: "2 more" });
	});

	test("caps what is drawn at 99, never what is read", () => {
		expect(resolveAvatarOverflowLabel(1234)).toEqual({ text: "99+", accessibilityLabel: "1234 more" });
	});
});

describe("resolveAvatarAccessibilityLabel", () => {
	test("prefers the name", () => {
		expect(resolveAvatarAccessibilityLabel({ name: "Kate Austen", fallback: "KA" })).toBe("Kate Austen");
	});

	test("falls back to the fallback text", () => {
		expect(resolveAvatarAccessibilityLabel({ fallback: "KA" })).toBe("KA");
	});

	test("is undefined when there is nothing to read", () => {
		expect(resolveAvatarAccessibilityLabel({ name: "  " })).toBeUndefined();
		expect(resolveAvatarAccessibilityLabel({})).toBeUndefined();
	});

	test("an explicit label wins over both", () => {
		expect(resolveAvatarAccessibilityLabel({ accessibilityLabel: "You", name: "Kate Austen" })).toBe("You");
	});
});
