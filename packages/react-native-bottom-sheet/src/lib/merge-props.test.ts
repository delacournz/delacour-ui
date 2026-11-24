import { describe, expect, test } from "bun:test";
import { mergeProps } from "./merge-props";

describe("mergeProps", () => {
	test("child props override slot props", () => {
		expect(mergeProps({ testID: "slot" }, { testID: "child" })).toMatchObject({ testID: "child" });
	});

	test("chains event handlers slot-first", () => {
		const order: string[] = [];
		const merged = mergeProps<{ onPress?: () => void }>(
			{ onPress: () => order.push("slot") },
			{ onPress: () => order.push("child") }
		);
		merged.onPress?.();
		expect(order).toEqual(["slot", "child"]);
	});

	test("keeps the slot's handler when the child forwards an undefined one", () => {
		// `<BottomSheet.Trigger asChild><Button onPress={maybe} /></BottomSheet.Trigger>`:
		// the trigger's open handler must survive a child's unset optional `onPress`.
		let opened = false;
		const merged = mergeProps<{ onPress?: () => void }>(
			{
				onPress: () => {
					opened = true;
				},
			},
			{ onPress: undefined }
		);
		merged.onPress?.();
		expect(opened).toBe(true);
	});

	test("flattens style into an array with the child last", () => {
		const merged = mergeProps({ style: { opacity: 1 } }, { style: { opacity: 0.5 } });
		expect(merged.style).toEqual([{ opacity: 1 }, { opacity: 0.5 }]);
	});
});
