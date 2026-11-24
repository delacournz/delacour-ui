import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "./button";

describe("Button", () => {
	test("is one button, named by its label", async () => {
		await renderWithProviders(<Button>Save</Button>);
		expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
	});

	test("an accessibilityLabel names an icon-only button", async () => {
		await renderWithProviders(<Button accessibilityLabel="Favourite" size="icon-md" />);
		expect(screen.getByRole("button", { name: "Favourite" })).toBeOnTheScreen();
	});

	test("an assistive activation calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Button onPress={onPress}>Save</Button>);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("isDisabled is announced and blocks the press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Button isDisabled onPress={onPress}>
				Save
			</Button>
		);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("isLoading is announced busy and blocks the press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Button isLoading onPress={onPress}>
				Save
			</Button>
		);
		const button = screen.getByRole("button");
		expect(button).toBeBusy();
		await fireEvent(button, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("spinnerPlacement only keeps the label for assistive tech", async () => {
		await renderWithProviders(
			<Button isLoading spinnerPlacement="only">
				Save
			</Button>
		);
		expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
	});

	test("a group passes isDisabled to its members", async () => {
		await renderWithProviders(
			<Button.Group isDisabled>
				<Button>One</Button>
				<Button>Two</Button>
			</Button.Group>
		);
		for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
	});
});
