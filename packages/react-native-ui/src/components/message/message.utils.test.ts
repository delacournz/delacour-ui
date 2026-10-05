import { describe, expect, test } from "bun:test";
import { createElement, Fragment } from "react";
import type { MessageStatus } from "./message.types";
import {
	extractMessageText,
	formatMessageTime,
	isEmojiOnly,
	MESSAGE_AVATAR_DISPLAY_NAME,
	resolveMessageAccessibilityActions,
	resolveMessageAccessibilityLabel,
	resolveMessageChildSlot,
	resolveMessageLabelParts,
	resolveMessageStatusLabel,
	shouldAnnounceStatusChange,
	shouldShowAvatar,
	shouldShowStatus,
} from "./message.utils";
import { MESSAGE_DIRECTIONS, MESSAGE_POSITIONS } from "./message.variants";

describe("resolveMessageStatusLabel", () => {
	test.each<[MessageStatus, string]>([
		[{ type: "sending" }, "Sending"],
		[{ type: "sent" }, "Sent"],
		[{ type: "delivered" }, "Delivered"],
		[{ type: "read" }, "Read"],
		[{ type: "read", readAt: new Date(2026, 9, 5) }, "Read"],
		[{ type: "failed" }, "Failed to send"],
		[{ type: "failed", reason: "No connection" }, "Failed: No connection"],
	])("%o reads %p", (status, label) => {
		expect(resolveMessageStatusLabel(status)).toBe(label);
	});

	test("a blank reason reads as no reason", () => {
		expect(resolveMessageStatusLabel({ type: "failed", reason: "  " })).toBe("Failed to send");
	});
});

describe("formatMessageTime", () => {
	const now = new Date(2026, 9, 5, 15, 0);

	test("the same day is the time of day", () => {
		expect(formatMessageTime(new Date(2026, 9, 5, 9, 41), now, "en-US")).toBe("9:41 AM");
	});

	test("the same day, later than now, is still the time of day", () => {
		expect(formatMessageTime(new Date(2026, 9, 5, 21, 5), now, "en-US")).toBe("9:05 PM");
	});

	test("the calendar day before is Yesterday, however few hours ago", () => {
		expect(formatMessageTime(new Date(2026, 9, 4, 23, 59), new Date(2026, 9, 5, 0, 1), "en-US")).toBe("Yesterday");
	});

	test("within the week is the weekday", () => {
		// 2026-10-01 is a Thursday.
		expect(formatMessageTime(new Date(2026, 9, 1, 12, 0), now, "en-US")).toBe("Thursday");
	});

	test("a week or more back is a short date", () => {
		expect(formatMessageTime(new Date(2026, 8, 28, 12, 0), now, "en-US")).toBe("Sep 28");
	});

	test("another year names the year", () => {
		expect(formatMessageTime(new Date(2025, 2, 3, 12, 0), now, "en-US")).toBe("Mar 3, 2025");
	});

	test("a future day is a short date, never a weekday", () => {
		expect(formatMessageTime(new Date(2026, 9, 7, 12, 0), now, "en-US")).toBe("Oct 7");
	});

	test("the locale is honoured", () => {
		expect(formatMessageTime(new Date(2026, 9, 5, 21, 5), now, "en-GB")).toBe("21:05");
	});

	test("never emits a narrow no-break space", () => {
		expect(formatMessageTime(new Date(2026, 9, 5, 9, 41), now, "en-US")).not.toMatch(/[  ]/);
	});
});

describe("isEmojiOnly", () => {
	test.each([
		["😀", true],
		["😀😀😀", true],
		["😀 😀", true],
		["  😀  ", true],
		["👨‍👩‍👧", true],
		["1️⃣", true],
		["#️⃣", true],
		["👍🏽", true],
		["🇳🇿", true],
		["❤️", true],
		["🏴‍☠️", true],
		["😀😀😀😀", false],
		["hi 😀", false],
		["😀!", false],
		["", false],
		["   ", false],
		["1", false],
		["abc", false],
	])("%p → %p", (text, expected) => {
		expect(isEmojiOnly(text)).toBe(expected);
	});
});

describe("shouldShowStatus", () => {
	test("only outgoing, only at the end of a run", () => {
		const shown = MESSAGE_DIRECTIONS.flatMap((direction) =>
			MESSAGE_POSITIONS.filter((position) => shouldShowStatus(position, direction)).map(
				(position) => `${direction}/${position}`
			)
		);
		expect(shown).toEqual(["outgoing/single", "outgoing/last"]);
	});
});

describe("shouldShowAvatar", () => {
	test("only incoming, only at the end of a run", () => {
		const shown = MESSAGE_DIRECTIONS.flatMap((direction) =>
			MESSAGE_POSITIONS.filter((position) => shouldShowAvatar(position, direction)).map(
				(position) => `${direction}/${position}`
			)
		);
		expect(shown).toEqual(["incoming/single", "incoming/last"]);
	});
});

describe("shouldAnnounceStatusChange", () => {
	test("sending → failed is announced", () => {
		expect(shouldAnnounceStatusChange({ type: "sending" }, { type: "failed" })).toBe(true);
	});

	test("any non-failed → failed is announced", () => {
		expect(shouldAnnounceStatusChange({ type: "sent" }, { type: "failed", reason: "x" })).toBe(true);
	});

	test.each<[MessageStatus, MessageStatus]>([
		[{ type: "sending" }, { type: "sent" }],
		[{ type: "sent" }, { type: "delivered" }],
		[{ type: "delivered" }, { type: "read" }],
		[{ type: "failed" }, { type: "failed", reason: "again" }],
		[{ type: "failed" }, { type: "sending" }],
	])("%o → %o is silent", (prev, next) => {
		expect(shouldAnnounceStatusChange(prev, next)).toBe(false);
	});

	test("a message that mounts already failed is history, not news", () => {
		expect(shouldAnnounceStatusChange(undefined, { type: "failed" })).toBe(false);
	});
});

describe("resolveMessageAccessibilityLabel", () => {
	test("incoming reads author, time, text", () => {
		expect(
			resolveMessageAccessibilityLabel({
				author: "Kate",
				direction: "incoming",
				text: "Are we still on for tonight?",
				time: "9:41 AM",
			})
		).toBe("Kate, 9:41 AM, Are we still on for tonight?");
	});

	test("incoming never reads a status", () => {
		expect(
			resolveMessageAccessibilityLabel({ author: "Kate", direction: "incoming", status: { type: "read" }, text: "Hi" })
		).toBe("Kate, Hi");
	});

	test("outgoing is You, and the receipt closes it", () => {
		expect(
			resolveMessageAccessibilityLabel({
				author: "Chris",
				direction: "outgoing",
				status: { type: "read" },
				text: "Yes!",
				time: "9:42 AM",
			})
		).toBe("You, 9:42 AM, Yes!, Read");
	});

	test("outgoing inside a run reads no receipt", () => {
		expect(
			resolveMessageAccessibilityLabel({
				direction: "outgoing",
				position: "first",
				status: { type: "delivered" },
				text: "One",
			})
		).toBe("You, One");
	});

	test("a status label override is what is read", () => {
		expect(
			resolveMessageAccessibilityLabel({
				direction: "outgoing",
				status: { type: "read" },
				statusLabel: "Seen by Kate",
				text: "Yes",
			})
		).toBe("You, Yes, Seen by Kate");
	});

	test("typing reads as the author typing", () => {
		expect(resolveMessageAccessibilityLabel({ author: "Kate", direction: "incoming", isTyping: true })).toBe(
			"Kate is typing"
		);
		expect(resolveMessageAccessibilityLabel({ direction: "incoming", isTyping: true })).toBe("Typing");
	});

	test("blank parts are skipped", () => {
		expect(resolveMessageAccessibilityLabel({ author: " ", direction: "incoming", text: "", time: "9:41 AM" })).toBe(
			"9:41 AM"
		);
	});
});

describe("resolveMessageAccessibilityActions", () => {
	test("nothing to do, no actions", () => {
		expect(resolveMessageAccessibilityActions({ hasLongPress: false, hasPress: false, hasRetry: false })).toEqual([]);
	});

	test("a press is activate", () => {
		expect(
			resolveMessageAccessibilityActions({ hasLongPress: false, hasPress: true, hasRetry: false }).map((a) => a.name)
		).toEqual(["activate"]);
	});

	test("a long press is both the platform's longpress and a named more", () => {
		const actions = resolveMessageAccessibilityActions({ hasLongPress: true, hasPress: false, hasRetry: false });
		expect(actions.map((a) => a.name)).toEqual(["longpress", "more"]);
		expect(actions.find((a) => a.name === "more")?.label).toBe("More actions");
	});

	test("a retry is a named retry", () => {
		const actions = resolveMessageAccessibilityActions({ hasLongPress: true, hasPress: true, hasRetry: true });
		expect(actions.map((a) => a.name)).toEqual(["activate", "longpress", "more", "retry"]);
		expect(actions.find((a) => a.name === "retry")?.label).toBe("Retry");
	});
});

describe("resolveMessageLabelParts", () => {
	test("no parts, nothing known", () => {
		expect(resolveMessageLabelParts([])).toEqual({ isTyping: false });
	});

	test("each part lands on its own field", () => {
		expect(
			resolveMessageLabelParts([
				{ kind: "author", value: "Kate" },
				{ kind: "time", value: "9:41 AM" },
				{ kind: "text", value: "Hi" },
				{ kind: "statusLabel", value: "Seen" },
			])
		).toEqual({ author: "Kate", isTyping: false, statusLabel: "Seen", text: "Hi", time: "9:41 AM" });
	});

	test("texts join in order; author and time keep the first", () => {
		const parts = resolveMessageLabelParts([
			{ kind: "text", value: "Are we" },
			{ kind: "author", value: "Kate" },
			{ kind: "text", value: "still on?" },
			{ kind: "author", value: "Ignored" },
		]);
		expect(parts.text).toBe("Are we still on?");
		expect(parts.author).toBe("Kate");
	});

	test("a blank part is dropped", () => {
		expect(resolveMessageLabelParts([{ kind: "text", value: "  " }]).text).toBeUndefined();
	});

	test("a typing part marks the message as typing", () => {
		expect(resolveMessageLabelParts([{ kind: "typing" }]).isTyping).toBe(true);
	});
});

describe("resolveMessageChildSlot", () => {
	test("the avatar goes in the gutter", () => {
		expect(resolveMessageChildSlot(MESSAGE_AVATAR_DISPLAY_NAME)).toBe("gutter");
	});

	test("anything else goes in the column", () => {
		expect(resolveMessageChildSlot("DelacourUI.Message.Bubble")).toBe("column");
		expect(resolveMessageChildSlot(undefined)).toBe("column");
	});
});

describe("extractMessageText", () => {
	test("strings and numbers read as written", () => {
		expect(extractMessageText("Hi")).toBe("Hi");
		expect(extractMessageText(42)).toBe("42");
	});

	test("nothing reads as nothing", () => {
		expect(extractMessageText(null)).toBe("");
		expect(extractMessageText(undefined)).toBe("");
		expect(extractMessageText(false)).toBe("");
	});

	test("arrays and nested elements are walked in order", () => {
		const nested = createElement("Text", null, "see ", createElement("Text", null, "this link"), "!");
		expect(extractMessageText(["Look, ", nested])).toBe("Look, see this link!");
	});

	test("fragments are walked", () => {
		expect(extractMessageText(createElement(Fragment, null, "a", "b"))).toBe("ab");
	});
});
