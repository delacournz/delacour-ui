import { describe, expect, test } from "bun:test";
import { composeRefs } from "./compose-refs";

describe("composeRefs", () => {
	test("assigns to every object ref", () => {
		const a: { current: string | null } = { current: null };
		const b: { current: string | null } = { current: null };
		composeRefs(a, b)("node");
		expect(a.current).toBe("node");
		expect(b.current).toBe("node");
	});

	test("calls every callback ref", () => {
		const seen: string[] = [];
		composeRefs<string>(
			(n) => {
				seen.push(`a:${n}`);
			},
			(n) => {
				seen.push(`b:${n}`);
			}
		)("node");
		expect(seen).toEqual(["a:node", "b:node"]);
	});

	test("mixes callback and object refs", () => {
		const obj: { current: string | null } = { current: null };
		const called: string[] = [];
		composeRefs<string>(obj, (n) => {
			if (n) called.push(n);
		})("node");
		expect(obj.current).toBe("node");
		expect(called).toEqual(["node"]);
	});

	test("skips null and undefined refs", () => {
		const obj: { current: string | null } = { current: null };
		expect(() => composeRefs<string>(null, undefined, obj)("node")).not.toThrow();
		expect(obj.current).toBe("node");
	});

	test("runs cleanups returned by callback refs on unmount", () => {
		const order: string[] = [];
		const cleanup = composeRefs<string>(
			() => () => {
				order.push("cleanup-a");
			},
			() => () => {
				order.push("cleanup-b");
			}
		)("node");
		expect(typeof cleanup).toBe("function");
		cleanup?.();
		expect(order).toEqual(["cleanup-a", "cleanup-b"]);
	});

	test("clears object refs on unmount when a cleanup runs", () => {
		const obj: { current: string | null } = { current: null };
		const cleanup = composeRefs<string>(obj, () => () => {})("node");
		expect(obj.current).toBe("node");
		cleanup?.();
		expect(obj.current).toBeNull();
	});
});
