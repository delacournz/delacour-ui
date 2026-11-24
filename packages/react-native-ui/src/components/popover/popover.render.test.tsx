import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Popover, type PopoverProps } from "./popover";
import { usePopover } from "./popover.context";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function RenamePopover(props: Omit<PopoverProps, "children">): ReactElement {
	return (
		<Popover {...props}>
			<Popover.Trigger asChild>
				<Button>Rename</Button>
			</Popover.Trigger>
			<Popover.Content>
				<Popover.Arrow />
				<Popover.Title>Rename file</Popover.Title>
				<Popover.Description>Shown to everyone.</Popover.Description>
				<Popover.Close asChild>
					<Button>Done</Button>
				</Popover.Close>
				<Popover.Close />
			</Popover.Content>
		</Popover>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

/**
 * The panel measures its trigger with `measureInWindow`, and Jest has no layout, so the
 * placement (flip, shift, arrow offset) is never resolved here and the panel never finishes entering, so focus in and out is verified on a simulator; `popover.position.test.ts`
 * covers it as pure logic. What is tested is open/close state, callbacks and semantics.
 */
describe("Popover", () => {
	test("renders only its trigger until opened", async () => {
		await renderWithProviders(<RenamePopover />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Rename" })).toBeOnTheScreen();
		expect(screen.queryByRole("header", { name: "Rename file" })).not.toBeOnTheScreen();
	});

	test("the trigger announces collapsed, then expanded", async () => {
		await renderWithProviders(<RenamePopover />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Rename" })).toBeCollapsed();
		await press("Rename");
		expect(screen.getByRole("button", { name: "Rename" })).toBeExpanded();
	});

	test("the trigger opens it, reporting true; the Close part shuts it, reporting false", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<RenamePopover onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Rename");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(screen.getByRole("header", { name: "Rename file" })).toBeOnTheScreen();
		expect(screen.getByText("Shown to everyone.")).toBeOnTheScreen();

		await press("Done");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
		expect(await screen.findByRole("button", { name: "Rename" })).toBeCollapsed();
	});

	test("the corner close button is labelled Close and shuts it", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<RenamePopover defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Close");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("the panel is a dialog labelled by its title", async () => {
		await renderWithProviders(<RenamePopover defaultOpen />, { wrapper: Overlays });
		expect(screen.getByLabelText("Rename file")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rename file")).toHaveProp("role", "dialog");
		expect(screen.getByLabelText("Rename file")).toHaveProp("accessibilityViewIsModal", true);
	});

	test("the panel escapes when dismissible, and has no escape when not", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<RenamePopover defaultOpen onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});
		const panel = screen.getByLabelText("Rename file");
		await act(() => panel.props.onAccessibilityEscape());
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await rerender(<RenamePopover isDismissible={false} isOpen />);
		expect(screen.getByLabelText("Rename file").props.onAccessibilityEscape).toBeUndefined();
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<RenamePopover defaultOpen />, { wrapper: Overlays });
		expect(screen.getByRole("header", { name: "Rename file" })).toBeOnTheScreen();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<RenamePopover isOpen={false} onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});
		await press("Rename");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("header", { name: "Rename file" })).not.toBeOnTheScreen();

		await rerender(<RenamePopover isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByRole("header", { name: "Rename file" })).toBeOnTheScreen();
	});

	test("controlled open: Close asks to close but the panel stays until isOpen changes", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<RenamePopover isOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Done");
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByRole("header", { name: "Rename file" })).toBeOnTheScreen();
	});

	test("the trigger and Close chain a press handler the child already has", async () => {
		const onTrigger = jest.fn();
		const onClose = jest.fn();
		await renderWithProviders(
			<Popover>
				<Popover.Trigger onPress={onTrigger}>
					<Text>Open</Text>
				</Popover.Trigger>
				<Popover.Content>
					<Popover.Close asChild onPress={onClose}>
						<Button>Done</Button>
					</Popover.Close>
				</Popover.Content>
			</Popover>,
			{ wrapper: Overlays }
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onTrigger).toHaveBeenCalledTimes(1);
		await press("Done");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test("Popover.Anchor renders its children and the trigger still opens the panel", async () => {
		await renderWithProviders(
			<Popover>
				<Popover.Anchor>
					<Text>Row</Text>
					<Popover.Trigger asChild>
						<Button>More</Button>
					</Popover.Trigger>
				</Popover.Anchor>
				<Popover.Content>
					<Popover.Title>Options</Popover.Title>
				</Popover.Content>
			</Popover>,
			{ wrapper: Overlays }
		);
		expect(screen.getByText("Row")).toBeOnTheScreen();
		await press("More");
		expect(screen.getByRole("header", { name: "Options" })).toBeOnTheScreen();
	});

	test("usePopover reports open state and closes", async () => {
		function Probe(): ReactElement {
			const { isOpen, close } = usePopover();
			return <Button onPress={close}>{isOpen ? "open" : "closed"}</Button>;
		}
		await renderWithProviders(
			<Popover defaultOpen>
				<Popover.Content>
					<Probe />
				</Popover.Content>
			</Popover>,
			{ wrapper: Overlays }
		);
		expect(screen.getByRole("button", { name: "open" })).toBeOnTheScreen();
		await press("open");
		expect(screen.queryByRole("button", { name: "open" })).not.toBeOnTheScreen();
	});

	test("a part used outside its root throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Popover.Title>Orphan</Popover.Title>)).resolves.toBeDefined();
			await expect(
				renderWithProviders(
					<Popover.Trigger>
						<Text>x</Text>
					</Popover.Trigger>
				)
			).rejects.toThrow("Popover parts must be used inside a <Popover>.");
			await expect(
				renderWithProviders(
					<Overlays>
						<Popover.Content>
							<Text>x</Text>
						</Popover.Content>
					</Overlays>
				)
			).rejects.toThrow("Popover parts must be used inside a <Popover>.");
		} finally {
			spy.mockRestore();
		}
	});

	test("usePopover outside a Popover throws", async () => {
		function Bare(): ReactElement {
			usePopover();
			return <Text>x</Text>;
		}
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Bare />)).rejects.toThrow("usePopover must be used inside a <Popover>.");
		} finally {
			spy.mockRestore();
		}
	});
});
