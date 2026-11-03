import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Chip } from "./chip";

const REMOVE = { nativeEvent: { actionName: "remove" } };

/*
 * A pressable chip with `onClose` is queried by a name prefix: RNTL derives the name from every
 * descendant, the hidden close control's "Remove" included, where iOS
 * (`RCTRecursiveAccessibilityLabel` skips `accessibilityElementsHidden`) and Android (`isSpeakingNode`
 * skips `no-hide-descendants`) leave it out.
 */

describe("Chip", () => {
	describe("what the props make it", () => {
		test("with no handler it is a tag, not announced as a control", async () => {
			await renderWithProviders(<Chip>Shipped</Chip>);
			expect(screen.getByText("Shipped")).toBeOnTheScreen();
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		});

		test("onPress makes it a button that is not announced as selected", async () => {
			const onPress = jest.fn();
			await renderWithProviders(<Chip onPress={onPress}>Design</Chip>);
			const chip = screen.getByRole("button", { name: "Design" });
			expect(chip).not.toBeSelected();
			await fireEvent(chip, "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("onLongPress alone makes it a button", async () => {
			await renderWithProviders(<Chip onLongPress={() => {}}>Design</Chip>);
			expect(screen.getByRole("button", { name: "Design" })).toBeOnTheScreen();
		});

		test.each([
			["isSelected={false}", () => <Chip isSelected={false}>Open</Chip>],
			["defaultSelected={false}", () => <Chip defaultSelected={false}>Open</Chip>],
			["onSelectedChange", () => <Chip onSelectedChange={() => {}}>Open</Chip>],
		])("%s makes it a toggle announced with its state", async (_name, element) => {
			await renderWithProviders(element());
			expect(screen.getByRole("button", { name: "Open" })).not.toBeSelected();
		});

		test("string and number children collapse into one label", async () => {
			await renderWithProviders(<Chip>{3} open</Chip>);
			expect(screen.getByText("3 open")).toBeOnTheScreen();
		});
	});

	describe("selection", () => {
		test("uncontrolled: defaultSelected seeds it and an activation flips it", async () => {
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Chip defaultSelected onSelectedChange={onSelectedChange}>
					Open
				</Chip>
			);
			const chip = screen.getByRole("button", { name: "Open" });
			expect(chip).toBeSelected();

			await fireEvent(chip, "accessibilityTap");
			expect(chip).not.toBeSelected();
			expect(onSelectedChange).toHaveBeenLastCalledWith(false);

			await fireEvent(chip, "accessibilityTap");
			expect(chip).toBeSelected();
			expect(onSelectedChange).toHaveBeenLastCalledWith(true);
		});

		test("controlled: reports the flip and waits for the prop", async () => {
			const onSelectedChange = jest.fn();
			const view = await renderWithProviders(
				<Chip isSelected={false} onSelectedChange={onSelectedChange}>
					Open
				</Chip>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityTap");
			expect(onSelectedChange).toHaveBeenCalledWith(true);
			expect(screen.getByRole("button")).not.toBeSelected();

			await view.rerender(
				<Chip isSelected onSelectedChange={onSelectedChange}>
					Open
				</Chip>
			);
			expect(screen.getByRole("button")).toBeSelected();
		});

		test("a toggle still calls onPress after flipping", async () => {
			const onPress = jest.fn();
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Chip onPress={onPress} onSelectedChange={onSelectedChange}>
					Open
				</Chip>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityTap");
			expect(onSelectedChange).toHaveBeenCalledWith(true);
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("a chip that is not a toggle is never selected", async () => {
			await renderWithProviders(<Chip onPress={() => {}}>Design</Chip>);
			expect(screen.getByRole("button")).not.toBeSelected();
		});
	});

	describe("disabled", () => {
		test("is announced and ignores activation", async () => {
			const onPress = jest.fn();
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Chip isDisabled onClose={() => {}} onPress={onPress} onSelectedChange={onSelectedChange}>
					Open
				</Chip>
			);
			const chip = screen.getByRole("button", { name: /^Open/ });
			expect(chip).toBeDisabled();
			await fireEvent(chip, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
			expect(onSelectedChange).not.toHaveBeenCalled();
		});

		test("does not remove through the remove action", async () => {
			const onClose = jest.fn();
			await renderWithProviders(
				<Chip isDisabled onClose={onClose} onPress={() => {}}>
					Open
				</Chip>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityAction", REMOVE);
			expect(onClose).not.toHaveBeenCalled();
		});

		test("disables a static chip's close control", async () => {
			const onClose = jest.fn();
			await renderWithProviders(
				<Chip closeTestID="close" isDisabled onClose={onClose}>
					Tag
				</Chip>
			);
			const close = screen.getByTestId("close");
			expect(close).toBeDisabled();
			await fireEvent(close, "accessibilityTap");
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe("onClose", () => {
		test("a static chip keeps the remove control as its own element, named Remove", async () => {
			const onClose = jest.fn();
			await renderWithProviders(<Chip onClose={onClose}>Tag</Chip>);
			await fireEvent(screen.getByRole("button", { name: "Remove" }), "accessibilityTap");
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		test("closeAccessibilityLabel names the remove control", async () => {
			await renderWithProviders(
				<Chip closeAccessibilityLabel="Remove Tag" onClose={() => {}}>
					Tag
				</Chip>
			);
			expect(screen.getByRole("button", { name: "Remove Tag" })).toBeOnTheScreen();
		});

		test("closeTestID reaches the remove control", async () => {
			const onClose = jest.fn();
			await renderWithProviders(
				<Chip closeTestID="close" onClose={onClose}>
					Tag
				</Chip>
			);
			await fireEvent(screen.getByTestId("close"), "accessibilityTap");
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		test("a pressable chip hides the control and offers a remove action instead", async () => {
			const onClose = jest.fn();
			const onPress = jest.fn();
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Chip
					closeAccessibilityLabel="Remove React"
					onClose={onClose}
					onPress={onPress}
					onSelectedChange={onSelectedChange}
				>
					React
				</Chip>
			);
			expect(screen.queryByRole("button", { name: "Remove React" })).not.toBeOnTheScreen();
			const chip = screen.getByRole("button", { name: /^React/ });
			expect(chip.props.accessibilityActions).toEqual(
				expect.arrayContaining([expect.objectContaining({ label: "Remove React", name: "remove" })])
			);

			await fireEvent(chip, "accessibilityAction", REMOVE);
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onPress).not.toHaveBeenCalled();
			expect(onSelectedChange).not.toHaveBeenCalled();
		});

		test("the remove action defaults its label to Remove and keeps the caller's actions", async () => {
			const onAccessibilityAction = jest.fn();
			await renderWithProviders(
				<Chip
					accessibilityActions={[{ label: "Edit", name: "edit" }]}
					onAccessibilityAction={onAccessibilityAction}
					onClose={() => {}}
					onPress={() => {}}
				>
					React
				</Chip>
			);
			const chip = screen.getByRole("button");
			expect(chip.props.accessibilityActions).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "edit" }),
					expect.objectContaining({ label: "Remove", name: "remove" }),
				])
			);
			await fireEvent(chip, "accessibilityAction", { nativeEvent: { actionName: "edit" } });
			expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
		});

		test("pressing the hidden control removes without toggling or pressing the chip", async () => {
			const onClose = jest.fn();
			const onPress = jest.fn();
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Chip closeTestID="close" onClose={onClose} onPress={onPress} onSelectedChange={onSelectedChange}>
					React
				</Chip>
			);
			await fireEvent(screen.getByTestId("close", { includeHiddenElements: true }), "accessibilityTap");
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onPress).not.toHaveBeenCalled();
			expect(onSelectedChange).not.toHaveBeenCalled();
		});
	});

	describe("compound parts", () => {
		test("Label, StartContent, EndContent and CloseButton render inside the root", async () => {
			const onClose = jest.fn();
			await renderWithProviders(
				<Chip onPress={() => {}}>
					<Chip.StartContent>
						<Chip.Label>Start</Chip.Label>
					</Chip.StartContent>
					<Chip.Label>Middle</Chip.Label>
					<Chip.EndContent>
						<Chip.Label>End</Chip.Label>
					</Chip.EndContent>
					<Chip.CloseButton accessibilityLabel="Dismiss" onPress={onClose} />
				</Chip>
			);
			expect(screen.getByText("Start")).toBeOnTheScreen();
			expect(screen.getByText("Middle")).toBeOnTheScreen();
			expect(screen.getByText("End")).toBeOnTheScreen();
			expect(screen.getByLabelText("Dismiss")).toBeOnTheScreen();
		});

		test.each([
			["Chip.Label", () => <Chip.Label>x</Chip.Label>],
			["Chip.CloseButton", () => <Chip.CloseButton />],
		])("%s outside a Chip throws", async (name, element) => {
			const original = console.error;
			console.error = () => {};
			try {
				await expect(renderWithProviders(element())).rejects.toThrow(`${name} must be rendered inside a <Chip>.`);
			} finally {
				console.error = original;
			}
		});
	});
});
