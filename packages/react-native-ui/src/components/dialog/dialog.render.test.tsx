import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Dialog, type DialogProps } from "./dialog";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function DeleteDialog(props: Omit<DialogProps, "children">): ReactElement {
	return (
		<Dialog {...props}>
			<Dialog.Trigger asChild>
				<Button>Delete</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete file?</Dialog.Title>
					<Dialog.Description>This cannot be undone.</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Dialog.Close asChild>
						<Button>Cancel</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

describe("Dialog", () => {
	test("renders nothing until opened", async () => {
		await renderWithProviders(<DeleteDialog />, { wrapper: Overlays });
		expect(screen.queryByRole("header", { name: "Delete file?" })).not.toBeOnTheScreen();
	});

	test("the trigger opens it and Close shuts it, reporting both", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<DeleteDialog onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Delete");
		expect(screen.getByRole("header", { name: "Delete file?" })).toBeOnTheScreen();
		expect(screen.getByText("This cannot be undone.")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await press("Cancel");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(await screen.findByRole("button", { name: "Delete" })).toBeOnTheScreen();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<DeleteDialog isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Delete");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("header", { name: "Delete file?" })).not.toBeOnTheScreen();
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<DeleteDialog defaultOpen />, { wrapper: Overlays });
		expect(screen.getByRole("header", { name: "Delete file?" })).toBeOnTheScreen();
	});
});
