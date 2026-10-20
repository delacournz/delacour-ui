import { describe, expect, test } from "bun:test";
import { createDebouncer } from "./search-bar.debounce";

/**
 * A clock the test advances by hand. Each scheduled task is held with the time
 * it is due, and `advance` runs whatever has come due — no real timer is ever
 * started, so the suite is exact and instant.
 */
function fakeClock() {
	let now = 0;
	let nextId = 1;
	const tasks = new Map<number, { due: number; run: () => void }>();

	return {
		schedule(run: () => void, delay: number): number {
			const id = nextId++;
			tasks.set(id, { due: now + delay, run });
			return id;
		},
		cancelSchedule(id: number): void {
			tasks.delete(id);
		},
		advance(ms: number): void {
			now += ms;
			for (const [id, task] of [...tasks]) {
				if (task.due <= now) {
					tasks.delete(id);
					task.run();
				}
			}
		},
		get pending(): number {
			return tasks.size;
		},
	};
}

function setup(delay: number) {
	const clock = fakeClock();
	const fired: string[] = [];
	const debouncer = createDebouncer<string, number>({
		cancelSchedule: clock.cancelSchedule,
		delay,
		onFire: (value) => fired.push(value),
		schedule: clock.schedule,
	});
	return { clock, debouncer, fired };
}

describe("createDebouncer", () => {
	test("fires the last value once, after the delay", () => {
		const { clock, debouncer, fired } = setup(300);
		debouncer.push("a");
		debouncer.push("ab");
		debouncer.push("abc");
		clock.advance(299);
		expect(fired).toEqual([]);
		clock.advance(1);
		expect(fired).toEqual(["abc"]);
		clock.advance(1000);
		expect(fired).toEqual(["abc"]);
	});

	test("each change restarts the wait", () => {
		const { clock, debouncer, fired } = setup(300);
		debouncer.push("a");
		clock.advance(200);
		debouncer.push("ab");
		clock.advance(200);
		expect(fired).toEqual([]);
		clock.advance(100);
		expect(fired).toEqual(["ab"]);
	});

	test("keeps exactly one timer alive", () => {
		const { clock, debouncer } = setup(300);
		debouncer.push("a");
		debouncer.push("b");
		debouncer.push("c");
		expect(clock.pending).toBe(1);
	});

	test("flush fires the pending value now and cancels the timer", () => {
		const { clock, debouncer, fired } = setup(300);
		debouncer.push("query");
		debouncer.flush();
		expect(fired).toEqual(["query"]);
		expect(clock.pending).toBe(0);
		clock.advance(1000);
		expect(fired).toEqual(["query"]);
	});

	test("flush with nothing pending does nothing", () => {
		const { debouncer, fired } = setup(300);
		debouncer.flush();
		expect(fired).toEqual([]);
	});

	test("cancel drops the pending value", () => {
		const { clock, debouncer, fired } = setup(300);
		debouncer.push("query");
		debouncer.cancel();
		clock.advance(1000);
		expect(fired).toEqual([]);
		expect(debouncer.isPending()).toBe(false);
	});

	test("a delay of 0 fires synchronously and schedules nothing", () => {
		const { clock, debouncer, fired } = setup(0);
		debouncer.push("a");
		expect(fired).toEqual(["a"]);
		debouncer.push("ab");
		expect(fired).toEqual(["a", "ab"]);
		expect(clock.pending).toBe(0);
	});

	test("fireNow replaces whatever was pending and fires at once — clear's empty string", () => {
		const { clock, debouncer, fired } = setup(300);
		debouncer.push("stale");
		debouncer.fireNow("");
		expect(fired).toEqual([""]);
		clock.advance(1000);
		expect(fired).toEqual([""]);
	});

	test("isPending tracks the timer", () => {
		const { clock, debouncer } = setup(300);
		expect(debouncer.isPending()).toBe(false);
		debouncer.push("a");
		expect(debouncer.isPending()).toBe(true);
		clock.advance(300);
		expect(debouncer.isPending()).toBe(false);
	});
});
