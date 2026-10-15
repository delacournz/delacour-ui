import { describe, expect, test } from "bun:test";
import {
	ANNOUNCE_COALESCE_MS,
	buildMessageRows,
	DEFAULT_RUN_WINDOW_MS,
	detectChange,
	distanceFromEnd,
	formatSeparatorDate,
	formatUnreadCount,
	formatUnreadDividerLabel,
	isSameCalendarDay,
	type MessageScrollerRow,
	resolveAnnouncementText,
	resolveFollowAnimation,
	resolveJumpButtonLabel,
	resolveJumpVisibility,
	resolveUnreadCount,
	shouldAnnounceNewMessages,
	shouldRequestOlder,
	shouldStickToBottom,
} from "./message-scroller.utils";

type Fixture = { id: string; at: Date; from: string };

const NOW = new Date(2026, 9, 5, 15, 0);

function message(id: string, from: string, at: Date): Fixture {
	return { id, at, from };
}

function rows(messages: readonly Fixture[], extra: { firstUnreadKey?: string; separateDates?: boolean } = {}) {
	return buildMessageRows(messages, {
		getKey: (item) => item.id,
		getDate: (item) => item.at,
		getSenderId: (item) => item.from,
		runWindowMs: DEFAULT_RUN_WINDOW_MS,
		separateDates: extra.separateDates ?? true,
		now: NOW,
		formatDate: formatSeparatorDate,
		firstUnreadKey: extra.firstUnreadKey,
	});
}

/** The rows reduced to what a test reads: a message's position, or the row kind. */
function shape(list: readonly MessageScrollerRow<Fixture>[]): string[] {
	return list.map((row) => {
		if (row.kind === "message") return `${row.message.id}:${row.position}`;
		if (row.kind === "date") return `date:${row.label}`;
		return `unread:${row.count}`;
	});
}

describe("shouldStickToBottom", () => {
	const base = { contentHeight: 2000, viewportHeight: 600, threshold: 80 };

	test("exactly at the end sticks", () => {
		expect(shouldStickToBottom({ ...base, offset: 1400 })).toBe(true);
	});

	test("79 points off sticks under an 80 threshold", () => {
		expect(shouldStickToBottom({ ...base, offset: 1400 - 79 })).toBe(true);
	});

	test("81 points off does not", () => {
		expect(shouldStickToBottom({ ...base, offset: 1400 - 81 })).toBe(false);
	});

	test("content shorter than the viewport always sticks", () => {
		expect(shouldStickToBottom({ ...base, contentHeight: 300, offset: 0 })).toBe(true);
	});

	test("a negative offset (overscroll at the top of short content) sticks", () => {
		expect(shouldStickToBottom({ ...base, contentHeight: 300, offset: -40 })).toBe(true);
	});
});

describe("distanceFromEnd", () => {
	test("is never negative, so an overscroll past the end reads as at the end", () => {
		expect(distanceFromEnd({ offset: 1500, contentHeight: 2000, viewportHeight: 600 })).toBe(0);
	});

	test("is the remaining scroll range", () => {
		expect(distanceFromEnd({ offset: 1000, contentHeight: 2000, viewportHeight: 600 })).toBe(400);
	});
});

describe("resolveJumpVisibility", () => {
	const threshold = 80;

	test("stays hidden in the hysteresis band when it was hidden", () => {
		expect(resolveJumpVisibility({ distanceFromEnd: 100, wasVisible: false, threshold })).toBe(false);
	});

	test("stays visible in the hysteresis band when it was visible", () => {
		expect(resolveJumpVisibility({ distanceFromEnd: 100, wasVisible: true, threshold })).toBe(true);
	});

	test("shows past one and a half thresholds", () => {
		expect(resolveJumpVisibility({ distanceFromEnd: 121, wasVisible: false, threshold })).toBe(true);
	});

	test("hides at the threshold", () => {
		expect(resolveJumpVisibility({ distanceFromEnd: 80, wasVisible: true, threshold })).toBe(false);
	});
});

describe("buildMessageRows", () => {
	const today = (hour: number, minute: number) => new Date(2026, 9, 5, hour, minute);

	test("no messages, no rows", () => {
		expect(rows([])).toEqual([]);
	});

	test("one message is a date row and a single", () => {
		expect(shape(rows([message("a", "aria", today(9, 0))]))).toEqual(["date:Today", "a:single"]);
	});

	test("three from one sender a minute apart are first, middle, last", () => {
		const list = [
			message("a", "aria", today(9, 0)),
			message("b", "aria", today(9, 1)),
			message("c", "aria", today(9, 2)),
		];
		expect(shape(rows(list))).toEqual(["date:Today", "a:first", "b:middle", "c:last"]);
	});

	test("a ten minute gap breaks a run from the same sender", () => {
		const list = [message("a", "aria", today(9, 0)), message("b", "aria", today(9, 10))];
		expect(shape(rows(list))).toEqual(["date:Today", "a:single", "b:single"]);
	});

	test("a change of sender breaks a run", () => {
		const list = [
			message("a", "aria", today(9, 0)),
			message("b", "isla", today(9, 1)),
			message("c", "isla", today(9, 2)),
		];
		expect(shape(rows(list))).toEqual(["date:Today", "a:single", "b:first", "c:last"]);
	});

	test("a new day inserts a separator and breaks the run, even for one sender", () => {
		const list = [message("a", "aria", new Date(2026, 9, 4, 23, 58)), message("b", "aria", today(0, 1))];
		expect(shape(rows(list))).toEqual(["date:Yesterday", "a:single", "date:Today", "b:single"]);
	});

	test("without date separators a new day still breaks the run", () => {
		const list = [message("a", "aria", new Date(2026, 9, 4, 23, 58)), message("b", "aria", today(0, 1))];
		expect(shape(rows(list, { separateDates: false }))).toEqual(["a:single", "b:single"]);
	});

	test("firstUnreadKey inserts one unread row counting the rest, and breaks the run", () => {
		const list = [
			message("a", "aria", today(9, 0)),
			message("b", "aria", today(9, 1)),
			message("c", "aria", today(9, 2)),
		];
		expect(shape(rows(list, { firstUnreadKey: "b" }))).toEqual([
			"date:Today",
			"a:single",
			"unread:2",
			"b:first",
			"c:last",
		]);
	});

	test("a firstUnreadKey that names no message adds nothing", () => {
		expect(shape(rows([message("a", "aria", today(9, 0))], { firstUnreadKey: "zzz" }))).toEqual([
			"date:Today",
			"a:single",
		]);
	});

	test("does not sort, and a decreasing timestamp does not throw", () => {
		const list = [message("b", "aria", today(9, 5)), message("a", "aria", today(9, 4))];
		expect(shape(rows(list))).toEqual(["date:Today", "b:first", "a:last"]);
	});

	test("row keys are unique and never collide with a message key", () => {
		const list = [message("date", "aria", new Date(2026, 9, 3, 9)), message("unread", "aria", today(9, 0))];
		const keys = rows(list, { firstUnreadKey: "unread" }).map((row) => row.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	test("marks the keys it is told are new", () => {
		const built = buildMessageRows([message("a", "aria", today(9, 0)), message("b", "aria", today(9, 1))], {
			getKey: (item) => item.id,
			getDate: (item) => item.at,
			getSenderId: (item) => item.from,
			runWindowMs: DEFAULT_RUN_WINDOW_MS,
			separateDates: false,
			now: NOW,
			formatDate: formatSeparatorDate,
			newKeys: new Set(["b"]),
		});
		expect(built.map((row) => (row.kind === "message" ? row.isNew : null))).toEqual([false, true]);
	});
});

describe("detectChange", () => {
	test("identical keys are no change", () => {
		expect(detectChange(["a", "b"], ["a", "b"])).toBe("none");
	});

	test("keys added after the last are an append", () => {
		expect(detectChange(["a", "b"], ["a", "b", "c"])).toBe("append");
	});

	test("keys added before the first are a prepend", () => {
		expect(detectChange(["c", "d"], ["a", "b", "c", "d"])).toBe("prepend");
	});

	test("keys added at both ends are a replace", () => {
		expect(detectChange(["b"], ["a", "b", "c"])).toBe("replace");
	});

	test("a first load from nothing is a replace, not an append", () => {
		expect(detectChange([], ["a", "b"])).toBe("replace");
	});

	test("a shrinking list is a replace", () => {
		expect(detectChange(["a", "b", "c"], ["a", "b"])).toBe("replace");
	});
});

describe("resolveUnreadCount", () => {
	const isOwn = (key: string) => key.startsWith("me");

	test("appends from others count while scrolled up", () => {
		expect(
			resolveUnreadCount({
				previousKeys: ["a"],
				nextKeys: ["a", "b", "c"],
				isOwn,
				isAtEnd: false,
				previousCount: 1,
			})
		).toBe(3);
	});

	test("a prepended older page does not count", () => {
		expect(
			resolveUnreadCount({ previousKeys: ["c"], nextKeys: ["a", "b", "c"], isOwn, isAtEnd: false, previousCount: 0 })
		).toBe(0);
	});

	test("the viewer's own messages do not count", () => {
		expect(
			resolveUnreadCount({ previousKeys: ["a"], nextKeys: ["a", "me1"], isOwn, isAtEnd: false, previousCount: 0 })
		).toBe(0);
	});

	test("at the end the count resets", () => {
		expect(
			resolveUnreadCount({ previousKeys: ["a"], nextKeys: ["a", "b"], isOwn, isAtEnd: true, previousCount: 4 })
		).toBe(0);
	});

	test("a shrinking list never goes negative or past its length", () => {
		expect(
			resolveUnreadCount({ previousKeys: ["a", "b", "c"], nextKeys: ["a"], isOwn, isAtEnd: false, previousCount: 3 })
		).toBe(1);
		expect(resolveUnreadCount({ previousKeys: ["a"], nextKeys: [], isOwn, isAtEnd: false, previousCount: 3 })).toBe(0);
	});
});

describe("isSameCalendarDay", () => {
	test("midnight splits two days five minutes apart", () => {
		expect(isSameCalendarDay(new Date(2026, 9, 4, 23, 58), new Date(2026, 9, 5, 0, 3))).toBe(false);
	});

	test("both ends of one day are the same day", () => {
		expect(isSameCalendarDay(new Date(2026, 9, 5, 0, 0), new Date(2026, 9, 5, 23, 59))).toBe(true);
	});

	test("a daylight-saving day is still one day", () => {
		// The southern-hemisphere spring-forward falls on the last Sunday of September; the
		// northern one on the last Sunday of March. Either way the calendar date is the same.
		expect(isSameCalendarDay(new Date(2026, 2, 29, 0, 30), new Date(2026, 2, 29, 23, 30))).toBe(true);
		expect(isSameCalendarDay(new Date(2026, 8, 27, 0, 30), new Date(2026, 8, 27, 23, 30))).toBe(true);
	});
});

describe("formatSeparatorDate", () => {
	test("today", () => {
		expect(formatSeparatorDate(new Date(2026, 9, 5, 0, 1), NOW)).toBe("Today");
	});

	test("yesterday, by calendar day rather than 24 hours", () => {
		expect(formatSeparatorDate(new Date(2026, 9, 4, 23, 59), new Date(2026, 9, 5, 0, 1))).toBe("Yesterday");
	});

	test("a weekday inside six days", () => {
		expect(formatSeparatorDate(new Date(2026, 9, 1, 12), NOW)).toBe("Thursday");
		expect(formatSeparatorDate(new Date(2026, 8, 29, 12), NOW)).toBe("Tuesday");
	});

	test("day and month past six days in the same year", () => {
		expect(formatSeparatorDate(new Date(2026, 8, 12, 12), NOW)).toBe("12 Sep");
	});

	test("day, month and year in another year", () => {
		expect(formatSeparatorDate(new Date(2025, 8, 12, 12), NOW)).toBe("12 Sep 2025");
	});

	test("across a daylight-saving change, Yesterday is still one calendar day back", () => {
		expect(formatSeparatorDate(new Date(2026, 2, 28, 23, 30), new Date(2026, 2, 29, 23, 30))).toBe("Yesterday");
		expect(formatSeparatorDate(new Date(2026, 8, 26, 23, 30), new Date(2026, 8, 27, 23, 30))).toBe("Yesterday");
	});

	test("a date in the future is written out, never as a weekday", () => {
		expect(formatSeparatorDate(new Date(2026, 9, 8, 12), NOW)).toBe("8 Oct");
	});
});

describe("shouldRequestOlder", () => {
	const base = { hasOlder: true, isLoadingOlder: false, alreadyRequestedForKey: undefined, firstKey: "a" };

	test("requests when there is more and nothing is in flight", () => {
		expect(shouldRequestOlder(base)).toBe(true);
	});

	test("not when there is no more history", () => {
		expect(shouldRequestOlder({ ...base, hasOlder: false })).toBe(false);
	});

	test("not while a page is loading", () => {
		expect(shouldRequestOlder({ ...base, isLoadingOlder: true })).toBe(false);
	});

	test("once per first key — a second threshold crossing is the same reach", () => {
		expect(shouldRequestOlder({ ...base, alreadyRequestedForKey: "a" })).toBe(false);
	});

	test("again once the first key has moved", () => {
		expect(shouldRequestOlder({ ...base, alreadyRequestedForKey: "z" })).toBe(true);
	});

	test("not on an empty list", () => {
		expect(shouldRequestOlder({ ...base, firstKey: undefined })).toBe(false);
	});
});

describe("resolveFollowAnimation", () => {
	test("calm never animates", () => {
		expect(resolveFollowAnimation({ distance: 10, viewportHeight: 600, isCalm: true })).toBe(false);
	});

	test("animates under one viewport", () => {
		expect(resolveFollowAnimation({ distance: 599, viewportHeight: 600, isCalm: false })).toBe(true);
	});

	test("jumps over one viewport", () => {
		expect(resolveFollowAnimation({ distance: 601, viewportHeight: 600, isCalm: false })).toBe(false);
	});
});

describe("shouldAnnounceNewMessages", () => {
	test("nothing to say", () => {
		expect(shouldAnnounceNewMessages({ count: 0, lastAnnouncedAt: 0, now: 10_000 })).toBe("none");
	});

	test("one message, outside the window", () => {
		expect(shouldAnnounceNewMessages({ count: 1, lastAnnouncedAt: 0, now: 10_000 })).toBe("single");
	});

	test("several, outside the window, coalesce", () => {
		expect(shouldAnnounceNewMessages({ count: 3, lastAnnouncedAt: 0, now: 10_000 })).toBe("batch");
	});

	test("inside the window it holds, so a burst becomes one announcement", () => {
		expect(
			shouldAnnounceNewMessages({ count: 1, lastAnnouncedAt: 10_000, now: 10_000 + ANNOUNCE_COALESCE_MS - 1 })
		).toBe("none");
	});

	test("the window is 1.5 s", () => {
		expect(ANNOUNCE_COALESCE_MS).toBe(1500);
	});
});

describe("resolveAnnouncementText", () => {
	test("one message names the sender when there is one", () => {
		expect(resolveAnnouncementText({ count: 1, senderName: "Aria" })).toBe("New message from Aria");
		expect(resolveAnnouncementText({ count: 1 })).toBe("New message");
	});

	test("several are counted", () => {
		expect(resolveAnnouncementText({ count: 3, senderName: "Aria" })).toBe("3 new messages");
	});
});

describe("resolveJumpButtonLabel", () => {
	test("nothing unread", () => {
		expect(resolveJumpButtonLabel(0)).toBe("Jump to latest");
	});

	test("one unread", () => {
		expect(resolveJumpButtonLabel(1)).toBe("Jump to latest, 1 unread");
	});

	test("caps the count", () => {
		expect(resolveJumpButtonLabel(120)).toBe("Jump to latest, 99+ unread");
	});

	test("takes a base label", () => {
		expect(resolveJumpButtonLabel(2, "Newest")).toBe("Newest, 2 unread");
	});
});

describe("formatUnreadCount", () => {
	test("zero is empty", () => {
		expect(formatUnreadCount(0)).toBe("");
	});

	test("small counts are digits", () => {
		expect(formatUnreadCount(7)).toBe("7");
		expect(formatUnreadCount(99)).toBe("99");
	});

	test("past 99 it caps", () => {
		expect(formatUnreadCount(100)).toBe("99+");
	});
});

describe("formatUnreadDividerLabel", () => {
	test("singular and plural", () => {
		expect(formatUnreadDividerLabel(1)).toBe("1 new message");
		expect(formatUnreadDividerLabel(3)).toBe("3 new messages");
	});
});
