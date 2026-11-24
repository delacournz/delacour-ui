import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { type ReactElement, type ReactNode, useState } from "react";
import { Platform, View } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Menu, type MenuProps } from "./menu";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function ItemsMenu({
	onRename,
	onDelete,
	...props
}: Omit<MenuProps, "children"> & { onRename?: () => void; onDelete?: () => void }): ReactElement {
	return (
		<Menu {...props}>
			<Menu.Trigger asChild>
				<Button>Options</Button>
			</Menu.Trigger>
			<Menu.Content>
				<Menu.Label>File</Menu.Label>
				<Menu.Item onSelect={onRename}>Rename</Menu.Item>
				<Menu.Separator />
				<Menu.Item isDisabled onSelect={onDelete}>
					Delete
				</Menu.Item>
			</Menu.Content>
		</Menu>
	);
}

type Measurable = {
	measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};
const originalOS = Platform.OS;
const checked = (name: string) => screen.getByRole("menuitem", { name }).props.accessibilityState?.checked;
const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
const choose = (name: string) => fireEvent(screen.getByRole("menuitem", { name }), "accessibilityTap");

/**
 * The panel measures its trigger with `measureInWindow` and the rows with layout, and Jest has
 * neither, so placement is never resolved here; `menu.variants.test.ts` covers it as pure logic.
 * The exit animation never finishes under the Reanimated mock, so closing is asserted through
 * `onOpenChange` and the trigger's expanded state, not through the panel unmounting. Rows are
 * activated like a screen reader does it, since the tap gesture is native. The `menu` and
 * `radiogroup` containers are not `accessible` (that would collapse their rows into one element),
 * so role queries cannot reach them; their rows are asserted instead.
 */
describe("Menu", () => {
	beforeEach(() => {
		Platform.OS = "ios";
		jest.spyOn(View.prototype as unknown as Measurable, "measureInWindow").mockImplementation((callback) => {
			callback(10, 100, 120, 40);
		});
	});
	afterEach(() => {
		Platform.OS = originalOS;
		jest.restoreAllMocks();
	});

	test("renders only its trigger until opened", async () => {
		await renderWithProviders(<ItemsMenu />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Options" })).toBeOnTheScreen();
		expect(screen.queryByRole("menuitem", { name: "Rename" })).not.toBeOnTheScreen();
	});

	test("the trigger announces collapsed, then expanded, and opens the menu", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<ItemsMenu onOpenChange={onOpenChange} />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Options" })).toBeCollapsed();

		await press("Options");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(screen.getByRole("button", { name: "Options" })).toBeExpanded();
		expect(screen.getByRole("menuitem", { name: "Rename" })).toBeOnTheScreen();
	});

	test("labels are headers and items are menuitems", async () => {
		await renderWithProviders(<ItemsMenu defaultOpen />, { wrapper: Overlays });
		expect(screen.getByRole("header", { name: "File" })).toBeOnTheScreen();
		expect(screen.getByRole("menuitem", { name: "Rename" })).toBeOnTheScreen();
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeOnTheScreen();
	});

	test("choosing an item calls onSelect and closes the menu", async () => {
		const onRename = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<ItemsMenu defaultOpen onOpenChange={onOpenChange} onRename={onRename} />, {
			wrapper: Overlays,
		});

		await choose("Rename");
		expect(onRename).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("button", { name: "Options" })).toBeCollapsed();
	});

	test("a disabled item is announced disabled and does not fire onSelect or close", async () => {
		const onDelete = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<ItemsMenu defaultOpen onDelete={onDelete} onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
		expect(screen.getByRole("menuitem", { name: "Rename" })).toBeEnabled();

		await choose("Delete");
		expect(onDelete).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("isClosedOnSelect false keeps the menu open after a choice", async () => {
		const onSelect = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Menu defaultOpen onOpenChange={onOpenChange}>
				<Menu.Content>
					<Menu.Item isClosedOnSelect={false} onSelect={onSelect}>
						Refresh
					</Menu.Item>
				</Menu.Content>
			</Menu>,
			{ wrapper: Overlays }
		);
		await choose("Refresh");
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<ItemsMenu isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Options");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("menuitem", { name: "Rename" })).not.toBeOnTheScreen();
	});

	test("controlled: the menu opens when the prop flips", async () => {
		const view = await renderWithProviders(<ItemsMenu isOpen={false} />, { wrapper: Overlays });
		await view.rerender(<ItemsMenu isOpen />);
		expect(screen.getByRole("menuitem", { name: "Rename" })).toBeOnTheScreen();
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<ItemsMenu defaultOpen />, { wrapper: Overlays });
		expect(screen.getByRole("menuitem", { name: "Rename" })).toBeOnTheScreen();
	});

	describe("Menu.CheckboxItem", () => {
		test("is announced checked or unchecked and stays open when toggled", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<Menu defaultOpen onOpenChange={onOpenChange}>
					<Menu.Content>
						<Menu.CheckboxItem defaultChecked>Completed</Menu.CheckboxItem>
						<Menu.CheckboxItem>Archived</Menu.CheckboxItem>
					</Menu.Content>
				</Menu>,
				{ wrapper: Overlays }
			);
			expect(checked("Completed")).toBe(true);
			expect(checked("Archived")).toBe(false);

			await choose("Archived");
			expect(checked("Archived")).toBe(true);
			expect(onOpenChange).not.toHaveBeenCalled();
		});

		test("uncontrolled: reports the next value", async () => {
			const onCheckedChange = jest.fn();
			await renderWithProviders(
				<Menu defaultOpen>
					<Menu.Content>
						<Menu.CheckboxItem onCheckedChange={onCheckedChange}>Completed</Menu.CheckboxItem>
					</Menu.Content>
				</Menu>,
				{ wrapper: Overlays }
			);
			await choose("Completed");
			expect(onCheckedChange).toHaveBeenLastCalledWith(true);
			await choose("Completed");
			expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		});

		test("controlled: waits for the prop before the tree changes", async () => {
			const onCheckedChange = jest.fn();
			const tree = (isChecked: boolean) => (
				<Menu defaultOpen>
					<Menu.Content>
						<Menu.CheckboxItem isChecked={isChecked} onCheckedChange={onCheckedChange}>
							Completed
						</Menu.CheckboxItem>
					</Menu.Content>
				</Menu>
			);
			const view = await renderWithProviders(tree(false), { wrapper: Overlays });

			await choose("Completed");
			expect(onCheckedChange).toHaveBeenCalledWith(true);
			expect(checked("Completed")).toBe(false);

			await view.rerender(tree(true));
			expect(checked("Completed")).toBe(true);
		});

		test("a disabled checkbox does not toggle", async () => {
			const onCheckedChange = jest.fn();
			await renderWithProviders(
				<Menu defaultOpen>
					<Menu.Content>
						<Menu.CheckboxItem isDisabled onCheckedChange={onCheckedChange}>
							Completed
						</Menu.CheckboxItem>
					</Menu.Content>
				</Menu>,
				{ wrapper: Overlays }
			);
			expect(screen.getByRole("menuitem", { name: "Completed" })).toBeDisabled();
			await choose("Completed");
			expect(onCheckedChange).not.toHaveBeenCalled();
		});
	});

	describe("Menu.RadioGroup", () => {
		function DensityMenu({
			onValueChange,
			onOpenChange,
			isClosedOnSelect,
			...group
		}: {
			isClosedOnSelect?: boolean;
			value?: string;
			defaultValue?: string;
			onValueChange?: (value: string) => void;
			onOpenChange?: (isOpen: boolean) => void;
		}): ReactElement {
			return (
				<Menu defaultOpen onOpenChange={onOpenChange}>
					<Menu.Content>
						<Menu.RadioGroup {...group} onValueChange={onValueChange}>
							<Menu.RadioItem isClosedOnSelect={isClosedOnSelect} value="comfortable">
								Comfortable
							</Menu.RadioItem>
							<Menu.RadioItem isClosedOnSelect={isClosedOnSelect} value="compact">
								Compact
							</Menu.RadioItem>
						</Menu.RadioGroup>
					</Menu.Content>
				</Menu>
			);
		}

		test("announces the selected item", async () => {
			await renderWithProviders(<DensityMenu defaultValue="compact" />, { wrapper: Overlays });
			expect(screen.getByRole("menuitem", { name: "Compact" })).toBeSelected();
			expect(screen.getByRole("menuitem", { name: "Comfortable" })).not.toBeSelected();
		});

		test("uncontrolled: choosing moves the selection, reports the value and closes", async () => {
			const onValueChange = jest.fn();
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<DensityMenu defaultValue="compact" onOpenChange={onOpenChange} onValueChange={onValueChange} />,
				{ wrapper: Overlays }
			);

			await choose("Comfortable");
			expect(onValueChange).toHaveBeenCalledWith("comfortable");
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
		});

		test("uncontrolled: the choice moves the selection when the menu stays open", async () => {
			await renderWithProviders(<DensityMenu defaultValue="compact" isClosedOnSelect={false} />, {
				wrapper: Overlays,
			});
			await choose("Comfortable");
			expect(screen.getByRole("menuitem", { name: "Comfortable" })).toBeSelected();
			expect(screen.getByRole("menuitem", { name: "Compact" })).not.toBeSelected();
		});

		test("re-choosing the selected item keeps it selected", async () => {
			await renderWithProviders(<DensityMenu defaultValue="compact" isClosedOnSelect={false} />, {
				wrapper: Overlays,
			});
			await choose("Compact");
			expect(screen.getByRole("menuitem", { name: "Compact" })).toBeSelected();
		});

		test("controlled: waits for the prop before the selection moves", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<DensityMenu isClosedOnSelect={false} onValueChange={onValueChange} value="compact" />,
				{
					wrapper: Overlays,
				}
			);

			await choose("Comfortable");
			expect(onValueChange).toHaveBeenCalledWith("comfortable");
			expect(screen.getByRole("menuitem", { name: "Compact" })).toBeSelected();

			await view.rerender(<DensityMenu isClosedOnSelect={false} onValueChange={onValueChange} value="comfortable" />);
			expect(screen.getByRole("menuitem", { name: "Comfortable" })).toBeSelected();
		});

		test("a RadioItem outside a RadioGroup throws", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(
				renderWithProviders(
					<Menu defaultOpen>
						<Menu.Content>
							<Menu.RadioItem value="a">A</Menu.RadioItem>
						</Menu.Content>
					</Menu>,
					{ wrapper: Overlays }
				)
			).rejects.toThrow("Menu.RadioItem must be used inside a <Menu.RadioGroup>.");
			spy.mockRestore();
		});
	});

	describe("Menu.Sub", () => {
		function MoveMenu({
			onMove,
			onOpenChange,
			...sub
		}: {
			onMove?: () => void;
			onOpenChange?: (isOpen: boolean) => void;
			isOpen?: boolean;
			defaultOpen?: boolean;
		}): ReactElement {
			return (
				<Menu defaultOpen>
					<Menu.Content>
						<Menu.Sub {...sub} onOpenChange={onOpenChange}>
							<Menu.SubTrigger>Move to</Menu.SubTrigger>
							<Menu.SubContent>
								<Menu.Item onSelect={onMove}>Inbox</Menu.Item>
							</Menu.SubContent>
						</Menu.Sub>
					</Menu.Content>
				</Menu>
			);
		}

		test("the trigger is collapsed and its rows are not mounted until opened", async () => {
			await renderWithProviders(<MoveMenu />, { wrapper: Overlays });
			expect(screen.getByRole("menuitem", { name: "Move to" })).toBeCollapsed();
			expect(screen.queryByRole("menuitem", { name: "Inbox" })).not.toBeOnTheScreen();
		});

		test("activating the trigger expands in place, reports it and does not close the menu", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<MoveMenu onOpenChange={onOpenChange} />, { wrapper: Overlays });

			await choose("Move to");
			expect(onOpenChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByRole("menuitem", { name: "Move to" })).toBeExpanded();
			expect(screen.getByRole("menuitem", { name: "Inbox" })).toBeOnTheScreen();

			await choose("Move to");
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(screen.getByRole("menuitem", { name: "Move to" })).toBeCollapsed();
		});

		test("defaultOpen starts expanded and its rows run onSelect", async () => {
			const onMove = jest.fn();
			await renderWithProviders(<MoveMenu defaultOpen onMove={onMove} />, { wrapper: Overlays });
			expect(screen.getByRole("menuitem", { name: "Move to" })).toBeExpanded();

			await choose("Inbox");
			expect(onMove).toHaveBeenCalledTimes(1);
		});

		test("controlled: isOpen decides, the trigger only asks", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<MoveMenu isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });
			await choose("Move to");
			expect(onOpenChange).toHaveBeenCalledWith(true);
			expect(screen.getByRole("menuitem", { name: "Move to" })).toBeCollapsed();
		});

		test("a SubTrigger outside a Sub throws", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(
				renderWithProviders(
					<Menu defaultOpen>
						<Menu.Content>
							<Menu.SubTrigger>Move to</Menu.SubTrigger>
						</Menu.Content>
					</Menu>,
					{ wrapper: Overlays }
				)
			).rejects.toThrow("Menu.SubTrigger must be used inside a <Menu.Sub>.");
			spy.mockRestore();
		});
	});

	test("a part used outside its Menu throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(<Menu.Item>Rename</Menu.Item>, { wrapper: Overlays })).rejects.toThrow(
			"Menu.Item must be used inside a <Menu>."
		);
		spy.mockRestore();
	});

	test("the trigger toggles: a second press closes", async () => {
		function Harness(): ReactElement {
			const [isOpen, setOpen] = useState(true);
			return <ItemsMenu isOpen={isOpen} onOpenChange={setOpen} />;
		}
		await renderWithProviders(<Harness />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Options" })).toBeExpanded();
		await press("Options");
		expect(screen.getByRole("button", { name: "Options" })).toBeCollapsed();
	});

	describe("on Android", () => {
		beforeEach(() => {
			Platform.OS = "android";
		});

		test("a row is activated through the activate accessibility action", async () => {
			const onRename = jest.fn();
			const onDelete = jest.fn();
			await renderWithProviders(<ItemsMenu defaultOpen onDelete={onDelete} onRename={onRename} />, {
				wrapper: Overlays,
			});

			await fireEvent(screen.getByRole("menuitem", { name: "Rename" }), "accessibilityAction", {
				nativeEvent: { actionName: "activate" },
			});
			expect(onRename).toHaveBeenCalledTimes(1);
		});

		test("a disabled row ignores the activate action", async () => {
			const onDelete = jest.fn();
			await renderWithProviders(<ItemsMenu defaultOpen onDelete={onDelete} />, { wrapper: Overlays });
			await fireEvent(screen.getByRole("menuitem", { name: "Delete" }), "accessibilityAction", {
				nativeEvent: { actionName: "activate" },
			});
			expect(onDelete).not.toHaveBeenCalled();
		});
	});
});
