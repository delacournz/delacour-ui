import { describe, expect, test } from "bun:test";
import { createElement, Fragment } from "react";
import {
	flattenAvatarChildren,
	resolveAvatarAccessibilityLabel,
	resolveAvatarGroup,
	resolveAvatarInitials,
	resolveAvatarOverflowLabel,
	resolveAvatarShowsImage,
	resolveAvatarSourceKey,
} from "./avatar.utils";

describe("resolveAvatarInitials", () => {
	test("takes the first letter of the first and last words", () => {
		expect(resolveAvatarInitials("Aria Whitlock")).toBe("AW");
		expect(resolveAvatarInitials("Anahera Rose Tui")).toBe("AT");
	});

	test("a single word gives a single letter", () => {
		expect(resolveAvatarInitials("Mihi")).toBe("M");
	});

	test("uppercases, and ignores surrounding and repeated whitespace", () => {
		expect(resolveAvatarInitials("  rawiri   kemp ")).toBe("RK");
		expect(resolveAvatarInitials("lena\tvarga")).toBe("LV");
	});

	test("is empty for an empty, blank or missing name", () => {
		expect(resolveAvatarInitials("")).toBe("");
		expect(resolveAvatarInitials("   ")).toBe("");
		expect(resolveAvatarInitials(undefined)).toBe("");
	});

	test("never splits a letter outside the basic plane", () => {
		// A naive `word[0]` would take half of a surrogate pair and draw a box.
		expect(resolveAvatarInitials("𝒜ria 𝒲hitlock")).toBe("𝒜𝒲");
	});

	test("keeps letters in scripts with no case", () => {
		expect(resolveAvatarInitials("森山 健二")).toBe("森健");
	});

	test("skips a leading punctuation mark in a word", () => {
		expect(resolveAvatarInitials("(Aria) 'Whitlock'")).toBe("AW");
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
		expect(resolveAvatarSourceKey(12)).toBe(JSON.stringify([["asset", 12]]));
	});

	test("tells a bundled asset from a uri of the same text", () => {
		expect(resolveAvatarSourceKey(3)).not.toBe(resolveAvatarSourceKey({ uri: "3" }));
	});

	test("changes when the cache mode changes, so a cache miss can retry", () => {
		expect(resolveAvatarSourceKey({ uri: "https://a.test/1.png", cache: "only-if-cached" })).not.toBe(
			resolveAvatarSourceKey({ uri: "https://a.test/1.png", cache: "reload" })
		);
	});

	test("changes when the method or body changes", () => {
		const get = resolveAvatarSourceKey({ uri: "https://a.test/1.png" });
		const post = resolveAvatarSourceKey({ uri: "https://a.test/1.png", method: "POST" });
		const body = resolveAvatarSourceKey({ uri: "https://a.test/1.png", method: "POST", body: "id=1" });
		expect(new Set([get, post, body]).size).toBe(3);
	});

	test("does not let header values that look like separators collide", () => {
		expect(resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { "X-A": "1&X-B=2" } })).not.toBe(
			resolveAvatarSourceKey({ uri: "https://a.test/1.png", headers: { "X-A": "1", "X-B": "2" } })
		);
	});

	test("does not let a uri that looks like a separator collide across a list", () => {
		expect(resolveAvatarSourceKey([{ uri: "https://a.test/1.png|uri:https://a.test/2.png" }])).not.toBe(
			resolveAvatarSourceKey([{ uri: "https://a.test/1.png" }, { uri: "https://a.test/2.png" }])
		);
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
		const both = resolveAvatarSourceKey([{ uri: "https://a.test/1x.png" }, { uri: "https://a.test/2x.png" }]);
		expect(both).not.toBe(resolveAvatarSourceKey([{ uri: "https://a.test/1x.png" }]));
		expect(both).not.toBe(resolveAvatarSourceKey([{ uri: "https://a.test/2x.png" }]));
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
		expect(resolveAvatarAccessibilityLabel({ name: "Aria Whitlock", fallback: "AW" })).toBe("Aria Whitlock");
	});

	test("falls back to the fallback text", () => {
		expect(resolveAvatarAccessibilityLabel({ fallback: "AW" })).toBe("AW");
	});

	test("is undefined when there is nothing to read", () => {
		expect(resolveAvatarAccessibilityLabel({ name: "  " })).toBeUndefined();
		expect(resolveAvatarAccessibilityLabel({})).toBeUndefined();
	});

	test("an explicit label wins over both", () => {
		expect(resolveAvatarAccessibilityLabel({ accessibilityLabel: "You", name: "Aria Whitlock" })).toBe("You");
	});
});

describe("flattenAvatarChildren", () => {
	const face = (name: string, key?: string) => createElement("Face", { key, name });
	const names = (children: Parameters<typeof flattenAvatarChildren>[0]) =>
		flattenAvatarChildren(children).map((child) => (child.props as { name: string }).name);

	test("keeps direct children in the order they were written", () => {
		expect(names([face("Ana"), face("Ben")])).toEqual(["Ana", "Ben"]);
	});

	test("counts each avatar inside a fragment as its own face", () => {
		expect(names(createElement(Fragment, null, face("Ana"), face("Ben")))).toEqual(["Ana", "Ben"]);
	});

	test("opens nested fragments and keeps the written order", () => {
		const nested = [
			face("Ana"),
			createElement(Fragment, null, face("Ben"), createElement(Fragment, null, face("Cai"))),
		];
		expect(names(nested)).toEqual(["Ana", "Ben", "Cai"]);
	});

	test("drops text, null and booleans", () => {
		expect(names([face("Ana"), "text", null, false, createElement(Fragment, null, true, face("Ben"))])).toEqual([
			"Ana",
			"Ben",
		]);
	});

	test("gives every face a unique key when two fragments reuse the same keys", () => {
		const keys = flattenAvatarChildren([
			createElement(Fragment, { key: "a" }, face("Ana", "x")),
			createElement(Fragment, { key: "b" }, face("Ben", "x")),
		]).map((child) => child.key);
		expect(new Set(keys).size).toBe(2);
	});
});
