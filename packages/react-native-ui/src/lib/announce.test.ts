import { describe, expect, test } from "bun:test";
import {
	ANNOUNCE_INTERVAL_MS,
	type AnnounceLiveRegion,
	type AnnounceRoute,
	createAnnouncer,
	resolveAnnounceRoute,
	resolveLiveRegion,
} from "./announce";

describe("resolveAnnounceRoute", () => {
	test("iOS always announces, queued when polite and cutting in when assertive", () => {
		expect(resolveAnnounceRoute({ platform: "ios", politeness: "polite" })).toEqual({
			kind: "announcement",
			queue: true,
		});
		expect(resolveAnnounceRoute({ platform: "ios", politeness: "assertive", channel: "live-region" })).toEqual({
			kind: "announcement",
			queue: false,
		});
	});

	test("Android uses a live region by default and an announcement only when asked — never both", () => {
		expect(resolveAnnounceRoute({ platform: "android", politeness: "polite" })).toEqual({
			kind: "live-region",
			politeness: "polite",
		});
		expect(resolveAnnounceRoute({ platform: "android", politeness: "assertive", channel: "announcement" })).toEqual({
			kind: "announcement",
			queue: false,
		});
	});

	test("web and other platforms use a live region, since they have no announcement API", () => {
		expect(resolveAnnounceRoute({ platform: "web", politeness: "polite", channel: "announcement" })).toEqual({
			kind: "live-region",
			politeness: "polite",
		});
	});

	test("an opt-out is silent everywhere", () => {
		for (const platform of ["ios", "android", "web"]) {
			expect(resolveAnnounceRoute({ platform, politeness: "assertive", enabled: false })).toEqual({ kind: "silent" });
		}
	});
});

describe("resolveLiveRegion", () => {
	test("only a live-region route sets the prop", () => {
		const routes: [AnnounceRoute, AnnounceLiveRegion][] = [
			[{ kind: "live-region", politeness: "assertive" }, "assertive"],
			[{ kind: "live-region", politeness: "polite" }, "polite"],
			[{ kind: "announcement", queue: true }, "none"],
			[{ kind: "silent" }, "none"],
		];
		for (const [route, expected] of routes) expect(resolveLiveRegion(route)).toBe(expected);
	});
});

function harness(interval = 500) {
	let clock = 0;
	const spoken: { message: string; queue: boolean; at: number }[] = [];
	const timers = new Map<number, { at: number; fn: () => void }>();
	let nextId = 1;
	const announcer = createAnnouncer({
		interval,
		now: () => clock,
		speak: (message, { queue }) => spoken.push({ message, queue, at: clock }),
		schedule: (fn, ms) => {
			const id = nextId++;
			timers.set(id, { at: clock + ms, fn });
			return id;
		},
		cancel: (id) => {
			timers.delete(id);
		},
	});
	const advance = (ms: number) => {
		const target = clock + ms;
		for (;;) {
			const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
			if (!due) break;
			clock = due[1].at;
			timers.delete(due[0]);
			due[1].fn();
		}
		clock = target;
	};
	return { announcer, spoken, advance, timers };
}

describe("createAnnouncer", () => {
	test("the default window is half a second", () => {
		expect(ANNOUNCE_INTERVAL_MS).toBe(500);
	});

	test("speaks the first message at once, queued when polite", () => {
		const { announcer, spoken } = harness();
		expect(announcer.announce({ message: "Saved" })).toBe("spoken");
		expect(spoken).toEqual([{ message: "Saved", queue: true, at: 0 }]);
	});

	test("an assertive message cuts in", () => {
		const { announcer, spoken } = harness();
		announcer.announce({ message: "Payment failed", politeness: "assertive" });
		expect(spoken[0]?.queue).toBe(false);
	});

	test("drops an empty or whitespace message", () => {
		const { announcer, spoken } = harness();
		expect(announcer.announce({ message: "   " })).toBe("dropped");
		expect(spoken).toEqual([]);
	});

	test("drops the same message repeated inside the window", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ message: "Loading" });
		advance(100);
		expect(announcer.announce({ message: "Loading" })).toBe("dropped");
		advance(1000);
		expect(spoken.map((s) => s.message)).toEqual(["Loading"]);
	});

	test("speaks the same message again once the window has passed", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ message: "Loading" });
		advance(500);
		expect(announcer.announce({ message: "Loading" })).toBe("spoken");
		expect(spoken).toHaveLength(2);
	});

	test("coalesces a burst on one key to its latest message, spoken when the window ends", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ key: "qty", message: "1" });
		advance(100);
		expect(announcer.announce({ key: "qty", message: "2" })).toBe("deferred");
		advance(100);
		expect(announcer.announce({ key: "qty", message: "3" })).toBe("deferred");
		advance(299);
		expect(spoken.map((s) => s.message)).toEqual(["1"]);
		advance(1);
		expect(spoken).toEqual([
			{ message: "1", queue: true, at: 0 },
			{ message: "3", queue: true, at: 500 },
		]);
	});

	test("a burst that returns to the message just spoken says nothing more", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ key: "qty", message: "1" });
		announcer.announce({ key: "qty", message: "2" });
		expect(announcer.announce({ key: "qty", message: "1" })).toBe("dropped");
		advance(2000);
		expect(spoken.map((s) => s.message)).toEqual(["1"]);
	});

	test("a flushed message opens a new window", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ key: "k", message: "a" });
		announcer.announce({ key: "k", message: "b" });
		advance(500);
		advance(100);
		expect(announcer.announce({ key: "k", message: "c" })).toBe("deferred");
		advance(400);
		expect(spoken.map((s) => [s.message, s.at])).toEqual([
			["a", 0],
			["b", 500],
			["c", 1000],
		]);
	});

	test("different keys never hold each other back", () => {
		const { announcer, spoken } = harness();
		announcer.announce({ key: "a", message: "One" });
		announcer.announce({ key: "b", message: "Two" });
		expect(spoken.map((s) => s.message)).toEqual(["One", "Two"]);
	});

	test("without a key, the message is the key: distinct messages pass, repeats coalesce", () => {
		const { announcer, spoken } = harness();
		announcer.announce({ message: "Toast one" });
		announcer.announce({ message: "Toast two" });
		announcer.announce({ message: "Toast one" });
		expect(spoken.map((s) => s.message)).toEqual(["Toast one", "Toast two"]);
	});

	test("a per-request interval overrides the default", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ key: "t", message: "a", interval: 2000 });
		advance(600);
		expect(announcer.announce({ key: "t", message: "b", interval: 2000 })).toBe("deferred");
		advance(1400);
		expect(spoken.map((s) => [s.message, s.at])).toEqual([
			["a", 0],
			["b", 2000],
		]);
	});

	test("the pending message keeps the politeness it was asked with", () => {
		const { announcer, spoken, advance } = harness();
		announcer.announce({ key: "k", message: "a" });
		announcer.announce({ key: "k", message: "b", politeness: "assertive" });
		advance(500);
		expect(spoken[1]).toEqual({ message: "b", queue: false, at: 500 });
	});

	test("cancel drops a key's pending message", () => {
		const { announcer, spoken, advance, timers } = harness();
		announcer.announce({ key: "k", message: "a" });
		announcer.announce({ key: "k", message: "b" });
		announcer.cancel("k");
		expect(timers.size).toBe(0);
		advance(1000);
		expect(spoken.map((s) => s.message)).toEqual(["a"]);
	});

	test("reset forgets every window and pending message", () => {
		const { announcer, spoken, timers } = harness();
		announcer.announce({ key: "k", message: "a" });
		announcer.announce({ key: "k", message: "b" });
		announcer.reset();
		expect(timers.size).toBe(0);
		expect(announcer.announce({ key: "k", message: "a" })).toBe("spoken");
		expect(spoken.map((s) => s.message)).toEqual(["a", "a"]);
	});
});
