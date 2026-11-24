import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Tree, type TreeProps } from "./tree";
import { TreeGroup } from "./tree-group";
import { TreeIndicator } from "./tree-indicator";
import { TreeItem } from "./tree-item";
import { TreeTrigger } from "./tree-trigger";

/**
 * The list root is deliberately not `accessible` (that would merge every row
 * into one element), so RNTL's role query cannot find it; its role is asserted
 * from the prop. The chevron is a Pressable hidden from assistive technology, so its own press
 * is not reachable by role or accessibility action under Jest. The row's
 * expand / collapse custom actions and `accessibilityTap` are tested instead;
 * the indicator's hit slop, rotation and haptics are playground-only.
 */

function activate(element: ReturnType<typeof screen.getByRole>) {
	return fireEvent(element, "accessibilityTap");
}

function customAction(element: ReturnType<typeof screen.getByRole>, actionName: string) {
	return fireEvent(element, "accessibilityAction", { nativeEvent: { actionName } });
}

function Demo(props: TreeProps): ReactElement {
	return (
		<Tree {...props}>
			<Tree.Item value="src">
				<Tree.Trigger>src</Tree.Trigger>
				<Tree.Group>
					<Tree.Item value="index">
						<Tree.Trigger>index.ts</Tree.Trigger>
					</Tree.Item>
					<Tree.Item value="lib">
						<Tree.Trigger>lib</Tree.Trigger>
						<Tree.Group>
							<Tree.Item value="util">
								<Tree.Trigger>util.ts</Tree.Trigger>
							</Tree.Item>
						</Tree.Group>
					</Tree.Item>
				</Tree.Group>
			</Tree.Item>
			<Tree.Item value="readme">
				<Tree.Trigger>README.md</Tree.Trigger>
			</Tree.Item>
		</Tree>
	);
}

describe("Tree", () => {
	test("renders a list of rows named by their labels, with their depth as the value", async () => {
		await renderWithProviders(<Demo defaultExpanded={["src", "lib"]} testID="tree" />);
		expect(screen.getByTestId("tree").props.accessibilityRole).toBe("list");
		expect(screen.getByRole("button", { name: "src" })).toHaveAccessibilityValue({ text: "Level 1" });
		expect(screen.getByRole("button", { name: "index.ts" })).toHaveAccessibilityValue({ text: "Level 2" });
		expect(screen.getByRole("button", { name: "util.ts" })).toHaveAccessibilityValue({ text: "Level 3" });
		expect(screen.getByRole("button", { name: "README.md" })).toHaveAccessibilityValue({ text: "Level 1" });
	});

	describe("expansion", () => {
		test("a branch announces expanded state and a leaf announces none", async () => {
			await renderWithProviders(<Demo defaultExpanded={["src"]} />);
			expect(screen.getByRole("button", { name: "src" })).toBeExpanded();
			expect(screen.getByRole("button", { name: "lib" })).toBeCollapsed();
			expect(screen.getByRole("button", { name: "index.ts" })).not.toBeExpanded();
			expect(screen.getByRole("button", { name: "index.ts" })).not.toBeCollapsed();
		});

		test("a closed branch unmounts its children", async () => {
			await renderWithProviders(<Demo />);
			expect(screen.getByRole("button", { name: "src" })).toBeCollapsed();
			expect(screen.queryByRole("button", { name: "index.ts" })).not.toBeOnTheScreen();
		});

		test("uncontrolled: pressing a branch row opens it, then closes it, reporting each", async () => {
			const onExpandedChange = jest.fn();
			await renderWithProviders(<Demo onExpandedChange={onExpandedChange} />);

			await activate(screen.getByRole("button", { name: "src" }));
			expect(screen.getByRole("button", { name: "src" })).toBeExpanded();
			expect(screen.getByRole("button", { name: "index.ts" })).toBeOnTheScreen();
			expect(onExpandedChange).toHaveBeenLastCalledWith(["src"], { isExpanded: true, value: "src" });

			await activate(screen.getByRole("button", { name: "src" }));
			expect(screen.getByRole("button", { name: "src" })).toBeCollapsed();
			expect(screen.queryByRole("button", { name: "index.ts" })).not.toBeOnTheScreen();
			expect(onExpandedChange).toHaveBeenLastCalledWith([], { isExpanded: false, value: "src" });
		});

		test("reopening a branch restores what was open inside it", async () => {
			await renderWithProviders(<Demo defaultExpanded={["src", "lib"]} />);
			await activate(screen.getByRole("button", { name: "src" }));
			await activate(screen.getByRole("button", { name: "src" }));
			expect(screen.getByRole("button", { name: "util.ts" })).toBeOnTheScreen();
		});

		test("the expand and collapse custom actions toggle a branch, and only the one that applies", async () => {
			const onExpandedChange = jest.fn();
			await renderWithProviders(<Demo onExpandedChange={onExpandedChange} />);

			await customAction(screen.getByRole("button", { name: "src" }), "collapse");
			expect(onExpandedChange).not.toHaveBeenCalled();

			await customAction(screen.getByRole("button", { name: "src" }), "expand");
			expect(screen.getByRole("button", { name: "src" })).toBeExpanded();
			expect(onExpandedChange).toHaveBeenCalledTimes(1);

			await customAction(screen.getByRole("button", { name: "src" }), "expand");
			expect(onExpandedChange).toHaveBeenCalledTimes(1);

			await customAction(screen.getByRole("button", { name: "src" }), "collapse");
			expect(screen.getByRole("button", { name: "src" })).toBeCollapsed();
		});

		test("controlled: reports the change and waits for the prop", async () => {
			const onExpandedChange = jest.fn();
			const view = await renderWithProviders(<Demo expanded={[]} onExpandedChange={onExpandedChange} />);

			await activate(screen.getByRole("button", { name: "src" }));
			expect(onExpandedChange).toHaveBeenCalledWith(["src"], { isExpanded: true, value: "src" });
			expect(screen.getByRole("button", { name: "src" })).toBeCollapsed();

			await view.rerender(<Demo expanded={["src"]} onExpandedChange={onExpandedChange} />);
			expect(screen.getByRole("button", { name: "src" })).toBeExpanded();
			expect(screen.getByRole("button", { name: "index.ts" })).toBeOnTheScreen();
		});

		test("expandOnPress={false} leaves the row's press without a toggle", async () => {
			const onExpandedChange = jest.fn();
			await renderWithProviders(<Demo expandOnPress={false} onExpandedChange={onExpandedChange} />);
			await activate(screen.getByRole("button", { name: "src" }));
			expect(onExpandedChange).not.toHaveBeenCalled();
			expect(screen.getByRole("button", { name: "src" })).toBeCollapsed();
		});

		test("hasChildren marks a node a branch before its group renders", async () => {
			await renderWithProviders(
				<Tree>
					<Tree.Item hasChildren value="lazy">
						<Tree.Trigger>Lazy</Tree.Trigger>
					</Tree.Item>
				</Tree>
			);
			expect(screen.getByRole("button", { name: "Lazy" })).toBeCollapsed();
		});
	});

	describe("selection", () => {
		test("selectionMode none announces no selected state and reports nothing", async () => {
			await renderWithProviders(<Demo defaultExpanded={["src"]} />);
			expect(screen.getByRole("button", { name: "index.ts" })).not.toBeSelected();
			expect(screen.getByRole("button", { name: "index.ts" }).props.accessibilityState).not.toHaveProperty("selected");
		});

		test("single, uncontrolled: defaultValue seeds it and a press moves it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Demo defaultExpanded={["src"]} defaultValue="index" onValueChange={onValueChange} selectionMode="single" />
			);
			expect(screen.getByRole("button", { name: "index.ts" })).toBeSelected();
			expect(screen.getByRole("button", { name: "README.md" })).not.toBeSelected();

			await activate(screen.getByRole("button", { name: "README.md" }));
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();
			expect(screen.getByRole("button", { name: "index.ts" })).not.toBeSelected();
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenLastCalledWith("readme");
		});

		test("single: re-pressing the selected node does not report again", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Demo defaultValue="readme" onValueChange={onValueChange} selectionMode="single" />);
			await activate(screen.getByRole("button", { name: "README.md" }));
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();
		});

		test("single: pressing a branch row both selects and toggles it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Demo onValueChange={onValueChange} selectionMode="single" />);
			await activate(screen.getByRole("button", { name: "src" }));
			expect(onValueChange).toHaveBeenCalledWith("src");
			expect(screen.getByRole("button", { name: "src" })).toBeSelected();
			expect(screen.getByRole("button", { name: "src" })).toBeExpanded();
		});

		test("single, controlled: reports the press and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<Demo onValueChange={onValueChange} selectionMode="single" value="readme" />
			);
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();

			await activate(screen.getByRole("button", { name: "src" }));
			expect(onValueChange).toHaveBeenCalledWith("src");
			expect(screen.getByRole("button", { name: "src" })).not.toBeSelected();
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();

			await view.rerender(<Demo onValueChange={onValueChange} selectionMode="single" value="src" />);
			expect(screen.getByRole("button", { name: "src" })).toBeSelected();
			expect(screen.getByRole("button", { name: "README.md" })).not.toBeSelected();
		});

		test("multiple, uncontrolled: presses add and remove, reporting the whole selection", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Demo
					defaultExpanded={["src"]}
					defaultValue={["index"]}
					onValueChange={onValueChange}
					selectionMode="multiple"
				/>
			);
			expect(screen.getByRole("button", { name: "index.ts" })).toBeSelected();

			await activate(screen.getByRole("button", { name: "README.md" }));
			expect(onValueChange).toHaveBeenLastCalledWith(["index", "readme"]);
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();
			expect(screen.getByRole("button", { name: "index.ts" })).toBeSelected();

			await activate(screen.getByRole("button", { name: "index.ts" }));
			expect(onValueChange).toHaveBeenLastCalledWith(["readme"]);
			expect(screen.getByRole("button", { name: "index.ts" })).not.toBeSelected();
		});

		test("multiple, controlled: reports the press and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<Demo onValueChange={onValueChange} selectionMode="multiple" value={[]} />
			);
			await activate(screen.getByRole("button", { name: "README.md" }));
			expect(onValueChange).toHaveBeenCalledWith(["readme"]);
			expect(screen.getByRole("button", { name: "README.md" })).not.toBeSelected();

			await view.rerender(<Demo onValueChange={onValueChange} selectionMode="multiple" value={["readme"]} />);
			expect(screen.getByRole("button", { name: "README.md" })).toBeSelected();
		});

		test("a row with nothing to do is inert: a leaf in a tree that does not select", async () => {
			const onExpandedChange = jest.fn();
			await renderWithProviders(<Demo defaultExpanded={["src"]} onExpandedChange={onExpandedChange} />);
			await activate(screen.getByRole("button", { name: "README.md" }));
			expect(onExpandedChange).not.toHaveBeenCalled();
		});

		test("a caller's onPress on the trigger runs after the press", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Tree>
					<Tree.Item value="a">
						<Tree.Trigger onPress={onPress}>Alpha</Tree.Trigger>
					</Tree.Item>
				</Tree>
			);
			await activate(screen.getByRole("button", { name: "Alpha" }));
			expect(onPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("disabled", () => {
		test("a disabled item is announced, offers no action and ignores presses", async () => {
			const onExpandedChange = jest.fn();
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Tree onExpandedChange={onExpandedChange} onValueChange={onValueChange} selectionMode="single">
					<Tree.Item isDisabled value="locked">
						<Tree.Trigger>Locked</Tree.Trigger>
						<Tree.Group>
							<Tree.Item value="child">
								<Tree.Trigger>Child</Tree.Trigger>
							</Tree.Item>
						</Tree.Group>
					</Tree.Item>
					<Tree.Item value="open">
						<Tree.Trigger>Open</Tree.Trigger>
					</Tree.Item>
				</Tree>
			);
			const locked = screen.getByRole("button", { name: "Locked" });
			expect(locked).toBeDisabled();
			expect(locked.props.accessibilityActions ?? []).toEqual([]);
			expect(screen.getByRole("button", { name: "Open" })).toBeEnabled();

			await activate(locked);
			await customAction(locked, "expand");
			expect(onExpandedChange).not.toHaveBeenCalled();
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.queryByRole("button", { name: "Child" })).not.toBeOnTheScreen();
		});

		test("the tree's isDisabled disables every node", async () => {
			const onExpandedChange = jest.fn();
			await renderWithProviders(<Demo isDisabled onExpandedChange={onExpandedChange} />);
			expect(screen.getByRole("button", { name: "src" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "README.md" })).toBeDisabled();
			await activate(screen.getByRole("button", { name: "src" }));
			expect(onExpandedChange).not.toHaveBeenCalled();
		});

		test("the tree's isDisabled={false} wins over a node's own isDisabled", async () => {
			await renderWithProviders(
				<Tree isDisabled={false}>
					<Tree.Item isDisabled value="a">
						<Tree.Trigger>Alpha</Tree.Trigger>
					</Tree.Item>
				</Tree>
			);
			expect(screen.getByRole("button", { name: "Alpha" })).toBeEnabled();
		});
	});

	describe("parts", () => {
		test("Label, Icon and Actions render inside a trigger; Actions stay outside the row's element", async () => {
			await renderWithProviders(
				<Tree>
					<Tree.Item value="a">
						<Tree.Trigger>
							<Tree.Label>Alpha</Tree.Label>
							<Tree.Actions>
								<Tree.Icon testID="trailing" />
							</Tree.Actions>
						</Tree.Trigger>
					</Tree.Item>
				</Tree>
			);
			expect(screen.getByRole("button", { name: "Alpha" })).toBeOnTheScreen();
			expect(screen.getByTestId("trailing")).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Alpha" })).not.toContainElement(screen.getByTestId("trailing"));
		});

		test("the indicator is hidden from assistive technology", async () => {
			await renderWithProviders(<Demo />);
			expect(screen.queryAllByRole("button", { includeHiddenElements: false })).toHaveLength(2);
		});
	});

	describe("outside its root", () => {
		let errorSpy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		});
		afterEach(() => {
			errorSpy.mockRestore();
		});

		test("Tree.Item outside a Tree throws", async () => {
			await expect(
				renderWithProviders(
					<TreeItem value="a">
						<TreeTrigger>A</TreeTrigger>
					</TreeItem>
				)
			).rejects.toThrow("Tree.Item must be rendered inside a <Tree>.");
		});

		test("Tree.Trigger outside a Tree throws", async () => {
			await expect(renderWithProviders(<TreeTrigger>A</TreeTrigger>)).rejects.toThrow(
				"Tree.Trigger must be rendered inside a <Tree>."
			);
		});

		test("Tree.Trigger inside a Tree but outside an Item throws", async () => {
			await expect(
				renderWithProviders(
					<Tree>
						<TreeTrigger>A</TreeTrigger>
					</Tree>
				)
			).rejects.toThrow("Tree.Trigger must be rendered inside a <Tree.Item>.");
		});

		test("Tree.Group inside a Tree but outside an Item throws", async () => {
			await expect(
				renderWithProviders(
					<Tree>
						<TreeGroup />
					</Tree>
				)
			).rejects.toThrow("Tree.Group must be rendered inside a <Tree.Item>.");
		});

		test("Tree.Indicator inside a Tree but outside an Item throws", async () => {
			await expect(
				renderWithProviders(
					<Tree>
						<TreeIndicator />
					</Tree>
				)
			).rejects.toThrow("Tree.Indicator must be rendered inside a <Tree.Item>.");
		});
	});
});
