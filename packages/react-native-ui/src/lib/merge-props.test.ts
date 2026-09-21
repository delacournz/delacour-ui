import { describe, expect, test } from "bun:test";
import { mergeProps } from "./merge-props";

describe("mergeProps", () => {
	test("child props override slot props", () => {
		expect(mergeProps({ testID: "slot" }, { testID: "child" })).toMatchObject({ testID: "child" });
	});

	test("slot props survive when the child omits them", () => {
		expect(mergeProps({ accessibilityRole: "button" }, {})).toMatchObject({ accessibilityRole: "button" });
	});

	test("chains event handlers slot-first", () => {
		const order: string[] = [];
		const merged = mergeProps<{ onPress?: (v: string) => void }>(
			{
				onPress: (v: string) => {
					order.push(`slot:${v}`);
				},
			},
			{
				onPress: (v: string) => {
					order.push(`child:${v}`);
				},
			}
		);
		merged.onPress?.("x");
		expect(order).toEqual(["slot:x", "child:x"]);
	});

	test("keeps a lone handler from either side", () => {
		let hit = false;
		const fromSlot = mergeProps<{ onPress?: () => void }>(
			{
				onPress: () => {
					hit = true;
				},
			},
			{}
		);
		fromSlot.onPress?.();
		expect(hit).toBe(true);

		hit = false;
		const fromChild = mergeProps<{ onPress?: () => void }>(
			{},
			{
				onPress: () => {
					hit = true;
				},
			}
		);
		fromChild.onPress?.();
		expect(hit).toBe(true);
	});

	test("merges className through cn so the child wins conflicts", () => {
		const merged = mergeProps({ className: "p-2 bg-primary" }, { className: "bg-secondary" });
		expect(merged.className).toBe("p-2 bg-secondary");
	});

	test("flattens style into an array with the child last", () => {
		const merged = mergeProps({ style: { opacity: 1 } }, { style: { opacity: 0.5 } });
		expect(merged.style).toEqual([{ opacity: 1 }, { opacity: 0.5 }]);
	});

	test("keeps a single style untouched", () => {
		expect(mergeProps({ style: { flex: 1 } }, {}).style).toEqual({ flex: 1 });
	});

	test("does not treat a non-function on* value as a handler", () => {
		expect(mergeProps({ onPress: undefined }, { onPress: undefined }).onPress).toBeUndefined();
	});

	test("never mutates its inputs", () => {
		const slot = { className: "p-2", onPress: () => {} };
		const child = { className: "p-4" };
		mergeProps(slot, child);
		expect(slot.className).toBe("p-2");
		expect(child.className).toBe("p-4");
	});
});
