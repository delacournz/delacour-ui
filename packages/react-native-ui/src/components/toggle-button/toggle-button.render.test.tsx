import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { ToggleButton, useToggleButton } from "./index";

type Host = ReturnType<typeof screen.getByRole>;

function isChecked(element: Host): boolean {
	const state = element.props.accessibilityState as { checked?: boolean } | undefined;
	return state?.checked === true;
}

function findHostByRole(role: string): boolean {
	const walk = (node: unknown): boolean => {
		if (node === null || typeof node !== "object") return false;
		if (Array.isArray(node)) return node.some(walk);
		const { props, children } = node as { props?: { accessibilityRole?: string }; children?: unknown };
		return props?.accessibilityRole === role || walk(children);
	};
	return walk(screen.toJSON());
}

async function activate(element: Parameters<typeof fireEvent>[0]): Promise<void> {
	await fireEvent(element, "accessibilityTap");
}

describe("ToggleButton standalone", () => {
	test("is a togglebutton named by its label, unchecked by default", async () => {
		await renderWithProviders(<ToggleButton>Follow</ToggleButton>);
		const toggle = screen.getByRole("togglebutton", { name: "Follow" });
		expect(toggle).toBeOnTheScreen();
		expect(isChecked(toggle)).toBe(false);
	});

	test("an accessibilityLabel names an icon-only toggle", async () => {
		await renderWithProviders(<ToggleButton accessibilityLabel="Bold" size="icon-md" />);
		expect(screen.getByRole("togglebutton", { name: "Bold" })).toBeOnTheScreen();
	});

	test("defaultSelected seeds the checked state", async () => {
		await renderWithProviders(<ToggleButton defaultSelected>Follow</ToggleButton>);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(true);
	});

	test("uncontrolled, a press flips itself and reports each new state", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(<ToggleButton onSelected={onSelected}>Follow</ToggleButton>);
		const toggle = screen.getByRole("togglebutton");
		await activate(toggle);
		expect(isChecked(toggle)).toBe(true);
		expect(onSelected).toHaveBeenLastCalledWith(true);
		await activate(toggle);
		expect(isChecked(toggle)).toBe(false);
		expect(onSelected).toHaveBeenLastCalledWith(false);
		expect(onSelected).toHaveBeenCalledTimes(2);
	});

	test("controlled, a press reports but waits for the prop", async () => {
		const onSelected = jest.fn();
		const { rerender } = await renderWithProviders(
			<ToggleButton isSelected={false} onSelected={onSelected}>
				Follow
			</ToggleButton>
		);
		const toggle = screen.getByRole("togglebutton");
		await activate(toggle);
		expect(onSelected).toHaveBeenCalledWith(true);
		expect(isChecked(toggle)).toBe(false);
		await rerender(
			<ToggleButton isSelected onSelected={onSelected}>
				Follow
			</ToggleButton>
		);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(true);
	});

	test("the caller's onPress runs, and sees the state from before the press", async () => {
		const seen: boolean[] = [];
		function Probe() {
			const [selected, setSelected] = useState(false);
			return (
				<ToggleButton isSelected={selected} onPress={() => seen.push(selected)} onSelected={setSelected}>
					Follow
				</ToggleButton>
			);
		}
		await renderWithProviders(<Probe />);
		await activate(screen.getByRole("togglebutton"));
		expect(seen).toEqual([false]);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(true);
	});

	test("isDisabled is announced and blocks onPress and onSelected", async () => {
		const onPress = jest.fn();
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton isDisabled onPress={onPress} onSelected={onSelected}>
				Follow
			</ToggleButton>
		);
		const toggle = screen.getByRole("togglebutton");
		expect(toggle).toBeDisabled();
		await activate(toggle);
		expect(onPress).not.toHaveBeenCalled();
		expect(onSelected).not.toHaveBeenCalled();
		expect(isChecked(toggle)).toBe(false);
	});

	test("isLoading is announced busy and blocks the press", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton isLoading onSelected={onSelected}>
				Follow
			</ToggleButton>
		);
		const toggle = screen.getByRole("togglebutton");
		expect(toggle).toBeBusy();
		await activate(toggle);
		expect(onSelected).not.toHaveBeenCalled();
	});

	test("a render-function child receives the state and follows it", async () => {
		await renderWithProviders(
			<ToggleButton>
				{({ isSelected, isDisabled }) => (
					<ToggleButton.Label>{`${isSelected ? "Saved" : "Save"}${isDisabled ? " (off)" : ""}`}</ToggleButton.Label>
				)}
			</ToggleButton>
		);
		expect(screen.getByText("Save")).toBeOnTheScreen();
		await activate(screen.getByRole("togglebutton"));
		expect(screen.getByText("Saved")).toBeOnTheScreen();
	});

	test("useToggleButton reads the state for a custom child", async () => {
		function Glyph() {
			const { isSelected } = useToggleButton();
			return <ToggleButton.Label>{isSelected ? "filled" : "empty"}</ToggleButton.Label>;
		}
		await renderWithProviders(
			<ToggleButton defaultSelected>
				<Glyph />
			</ToggleButton>
		);
		expect(screen.getByText("filled")).toBeOnTheScreen();
	});
});

describe("ToggleButton.Group multiple", () => {
	test("members are checkable togglebuttons and the group announces no role", async () => {
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={["bold"]}>
				<ToggleButton value="bold">Bold</ToggleButton>
				<ToggleButton value="italic">Italic</ToggleButton>
			</ToggleButton.Group>
		);
		expect(findHostByRole("radiogroup")).toBe(false);
		expect(isChecked(screen.getByRole("togglebutton", { name: "Bold" }))).toBe(true);
		expect(isChecked(screen.getByRole("togglebutton", { name: "Italic" }))).toBe(false);
	});

	test("uncontrolled, presses add and remove in press order and report the whole list", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group onSelected={onSelected}>
				<ToggleButton value="a">A</ToggleButton>
				<ToggleButton value="b">B</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("togglebutton", { name: "B" }));
		expect(onSelected).toHaveBeenLastCalledWith(["b"]);
		await activate(screen.getByRole("togglebutton", { name: "A" }));
		expect(onSelected).toHaveBeenLastCalledWith(["b", "a"]);
		await activate(screen.getByRole("togglebutton", { name: "B" }));
		expect(onSelected).toHaveBeenLastCalledWith(["a"]);
		expect(isChecked(screen.getByRole("togglebutton", { name: "A" }))).toBe(true);
		expect(isChecked(screen.getByRole("togglebutton", { name: "B" }))).toBe(false);
	});

	test("controlled, a press reports and the tree waits for the prop", async () => {
		const onSelected = jest.fn();
		const { rerender } = await renderWithProviders(
			<ToggleButton.Group onSelected={onSelected} selected={[]}>
				<ToggleButton value="a">A</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("togglebutton"));
		expect(onSelected).toHaveBeenCalledWith(["a"]);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(false);
		await rerender(
			<ToggleButton.Group onSelected={onSelected} selected={["a"]}>
				<ToggleButton value="a">A</ToggleButton>
			</ToggleButton.Group>
		);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(true);
	});

	test("the toggle's own onSelected is not called inside a group", async () => {
		const own = jest.fn();
		const group = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group onSelected={group}>
				<ToggleButton onSelected={own} value="a">
					A
				</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("togglebutton"));
		expect(group).toHaveBeenCalledWith(["a"]);
		expect(own).not.toHaveBeenCalled();
	});

	test("a grouped toggle ignores its own isSelected", async () => {
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={[]}>
				<ToggleButton isSelected value="a">
					A
				</ToggleButton>
			</ToggleButton.Group>
		);
		expect(isChecked(screen.getByRole("togglebutton"))).toBe(false);
	});

	test("isSelectionRequired refuses to clear the last selection", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={["a"]} isSelectionRequired onSelected={onSelected}>
				<ToggleButton value="a">A</ToggleButton>
				<ToggleButton value="b">B</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("togglebutton", { name: "A" }));
		expect(onSelected).not.toHaveBeenCalled();
		expect(isChecked(screen.getByRole("togglebutton", { name: "A" }))).toBe(true);
	});

	test("a grouped toggle without a value never selects and warns", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			const onSelected = jest.fn();
			await renderWithProviders(
				<ToggleButton.Group onSelected={onSelected}>
					<ToggleButton>Nameless</ToggleButton>
				</ToggleButton.Group>
			);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs a `value`"));
			await activate(screen.getByRole("togglebutton"));
			expect(onSelected).not.toHaveBeenCalled();
			expect(isChecked(screen.getByRole("togglebutton"))).toBe(false);
		} finally {
			warn.mockRestore();
		}
	});

	test("a disabled group blocks every member, and a member's own isDisabled={false} wins", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group isDisabled onSelected={onSelected}>
				<ToggleButton value="a">A</ToggleButton>
				<ToggleButton isDisabled={false} value="b">
					B
				</ToggleButton>
			</ToggleButton.Group>
		);
		const a = screen.getByRole("togglebutton", { name: "A" });
		const b = screen.getByRole("togglebutton", { name: "B" });
		expect(a).toBeDisabled();
		expect(b).not.toBeDisabled();
		await activate(a);
		expect(onSelected).not.toHaveBeenCalled();
		await activate(b);
		expect(onSelected).toHaveBeenCalledWith(["b"]);
	});

	test("a member can disable itself inside an enabled group", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group onSelected={onSelected}>
				<ToggleButton isDisabled value="a">
					A
				</ToggleButton>
			</ToggleButton.Group>
		);
		const a = screen.getByRole("togglebutton");
		expect(a).toBeDisabled();
		await activate(a);
		expect(onSelected).not.toHaveBeenCalled();
	});

	test("a detached group behaves the same", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group layout="detached" onSelected={onSelected} orientation="vertical">
				<ToggleButton value="open">Open</ToggleButton>
				<ToggleButton value="closed">Closed</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("togglebutton", { name: "Closed" }));
		expect(onSelected).toHaveBeenCalledWith(["closed"]);
		expect(isChecked(screen.getByRole("togglebutton", { name: "Closed" }))).toBe(true);
	});
});

describe("ToggleButton.Group single", () => {
	test("is a radiogroup of radios announced selected, not checked", async () => {
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={["left"]} selectionMode="single">
				<ToggleButton value="left">Left</ToggleButton>
				<ToggleButton value="right">Right</ToggleButton>
			</ToggleButton.Group>
		);
		expect(findHostByRole("radiogroup")).toBe(true);
		expect(screen.queryByRole("togglebutton")).not.toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Left" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Right" })).not.toBeSelected();
	});

	test("a press replaces the selection and reports the one value", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={["left"]} onSelected={onSelected} selectionMode="single">
				<ToggleButton value="left">Left</ToggleButton>
				<ToggleButton value="right">Right</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("radio", { name: "Right" }));
		expect(onSelected).toHaveBeenCalledWith(["right"]);
		expect(screen.getByRole("radio", { name: "Right" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Left" })).not.toBeSelected();
	});

	test("a re-press clears the selection, unless one is required", async () => {
		const onSelected = jest.fn();
		const { unmount } = await renderWithProviders(
			<ToggleButton.Group defaultSelected={["left"]} onSelected={onSelected} selectionMode="single">
				<ToggleButton value="left">Left</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("radio"));
		expect(onSelected).toHaveBeenCalledWith([]);
		expect(screen.getByRole("radio")).not.toBeSelected();
		await unmount();

		const required = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group defaultSelected={["left"]} isSelectionRequired onSelected={required} selectionMode="single">
				<ToggleButton value="left">Left</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("radio"));
		expect(required).not.toHaveBeenCalled();
		expect(screen.getByRole("radio")).toBeSelected();
	});

	test("a controlled group handed several values collapses to the one pressed", async () => {
		const onSelected = jest.fn();
		await renderWithProviders(
			<ToggleButton.Group onSelected={onSelected} selectionMode="single" selected={["a", "b"]}>
				<ToggleButton value="a">A</ToggleButton>
				<ToggleButton value="b">B</ToggleButton>
				<ToggleButton value="c">C</ToggleButton>
			</ToggleButton.Group>
		);
		await activate(screen.getByRole("radio", { name: "C" }));
		expect(onSelected).toHaveBeenCalledWith(["c"]);
	});
});

describe("ToggleButton parts outside their root", () => {
	const silenced = console.error;
	afterEach(() => {
		console.error = silenced;
	});

	test("ToggleButton.Label throws outside a ToggleButton", async () => {
		console.error = () => undefined;
		await expect(renderWithProviders(<ToggleButton.Label>Orphan</ToggleButton.Label>)).rejects.toThrow(
			"ToggleButton.Label must be rendered inside a <ToggleButton>."
		);
	});

	test("useToggleButton throws outside a ToggleButton", async () => {
		console.error = () => undefined;
		function Orphan() {
			useToggleButton();
			return null;
		}
		await expect(renderWithProviders(<Orphan />)).rejects.toThrow(
			"useToggleButton must be called inside a <ToggleButton>."
		);
	});
});
