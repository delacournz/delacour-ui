import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Steps } from "./steps";
import { useSteps, useStepsItem } from "./steps.context";

/*
 * Accessible names are matched by regex: RNTL derives a name from descendants
 * hidden with `accessibilityElementsHidden` (the indicator's number), which
 * native platforms skip.
 *
 * Not testable under Jest: the connectors (laid out with flex, no measurement),
 * the glyph's `ZoomIn` entrance and the fade on a disabled step. Pixels and
 * motion are verified in the playground on a simulator.
 */

function Flow({ props }: { props?: Partial<React.ComponentProps<typeof Steps>> }) {
	return (
		<Steps {...props}>
			<Steps.Item step={0}>Account</Steps.Item>
			<Steps.Item step={1} testID="step-shipping">
				Shipping
			</Steps.Item>
			<Steps.Item step={2}>Payment</Steps.Item>
		</Steps>
	);
}

const activate = (el: Parameters<typeof fireEvent>[0]) => fireEvent(el, "accessibilityTap");

describe("Steps", () => {
	test("each step is a button named by its title, with a position value", async () => {
		await renderWithProviders(<Flow props={{ defaultValue: 1 }} />);
		const done = screen.getByRole("button", { name: /Account/ });
		const current = screen.getByRole("button", { name: /Shipping/ });
		const upcoming = screen.getByRole("button", { name: /Payment/ });
		expect(done).toHaveAccessibilityValue({ text: "Step 1 of 3, completed" });
		expect(current).toHaveAccessibilityValue({ text: "Step 2 of 3, current" });
		expect(upcoming).toHaveAccessibilityValue({ text: "Step 3 of 3, upcoming" });
	});

	test("only the current step is selected", async () => {
		await renderWithProviders(<Flow props={{ defaultValue: 1 }} />);
		expect(screen.getByRole("button", { name: /Account/ })).not.toBeSelected();
		expect(screen.getByRole("button", { name: /Shipping/ })).toBeSelected();
		expect(screen.getByRole("button", { name: /Payment/ })).not.toBeSelected();
	});

	test("a completed override keeps the current step selected", async () => {
		await renderWithProviders(
			<Steps defaultValue={1}>
				<Steps.Item step={0}>Account</Steps.Item>
				<Steps.Item completed step={1}>
					Shipping
				</Steps.Item>
			</Steps>
		);
		const current = screen.getByRole("button", { name: /Shipping/ });
		expect(current).toBeSelected();
		expect(current).toHaveAccessibilityValue({ text: "Step 2 of 2, completed" });
	});

	test("the number is hidden from assistive technology but shown", async () => {
		await renderWithProviders(<Flow props={{ defaultValue: 0 }} />);
		expect(screen.getByText("2", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("2")).not.toBeOnTheScreen();
	});

	test("isInvalid and isLoading are announced", async () => {
		await renderWithProviders(
			<Steps defaultValue={1}>
				<Steps.Item isInvalid step={0}>
					Account
				</Steps.Item>
				<Steps.Item isLoading step={1}>
					Shipping
				</Steps.Item>
			</Steps>
		);
		expect(screen.getByRole("button", { name: /Account/ })).toHaveAccessibilityValue({
			text: "Step 1 of 2, completed, has an error",
		});
		const loading = screen.getByRole("button", { name: /Shipping/ });
		expect(loading).toHaveAccessibilityValue({ text: "Step 2 of 2, current, loading" });
		expect(loading).toBeBusy();
	});

	test("Title and Description compose and name the step", async () => {
		await renderWithProviders(
			<Steps orientation="vertical">
				<Steps.Item step={0}>
					<Steps.Title>Order placed</Steps.Title>
					<Steps.Description>We have your order.</Steps.Description>
				</Steps.Item>
			</Steps>
		);
		expect(screen.getByRole("button", { name: /Order placed/ })).toBeOnTheScreen();
		expect(screen.getByText("We have your order.")).toBeOnTheScreen();
	});

	describe("uncontrolled", () => {
		test("a press moves the value and calls onValueChange with the step", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Flow props={{ onValueChange }} />);
			await activate(screen.getByRole("button", { name: /Payment/ }));
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith(2);
			expect(screen.getByRole("button", { name: /Payment/ })).toBeSelected();
			expect(screen.getByRole("button", { name: /Account/ })).not.toBeSelected();
		});

		test("re-pressing the current step does not call onValueChange", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Flow props={{ defaultValue: 1, onValueChange }} />);
			await activate(screen.getByRole("button", { name: /Shipping/ }));
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("a step's own onPress fires too", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Steps>
					<Steps.Item onPress={onPress} step={0}>
						Account
					</Steps.Item>
					<Steps.Item onPress={onPress} step={1}>
						Shipping
					</Steps.Item>
				</Steps>
			);
			await activate(screen.getByRole("button", { name: /Shipping/ }));
			expect(onPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("controlled", () => {
		test("reports the change and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(<Flow props={{ onValueChange, value: 0 }} />);
			await activate(screen.getByRole("button", { name: /Shipping/ }));
			expect(onValueChange).toHaveBeenCalledWith(1);
			expect(screen.getByRole("button", { name: /Account/ })).toBeSelected();

			await view.rerender(<Flow props={{ onValueChange, value: 1 }} />);
			expect(screen.getByRole("button", { name: /Shipping/ })).toBeSelected();
		});

		test("a value with no onValueChange is a read-only display, not buttons", async () => {
			await renderWithProviders(<Flow props={{ value: 1 }} />);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			const current = screen.getByTestId("step-shipping");
			expect(current).toBeSelected();
			expect(current).toHaveAccessibilityValue({ text: "Step 2 of 3, current" });
		});

		test("isReadOnly forces a display even with onValueChange", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Flow props={{ isReadOnly: true, onValueChange, value: 0 }} />);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("isReadOnly={false} keeps a controlled value without a handler pressable", async () => {
			await renderWithProviders(<Flow props={{ isReadOnly: false, value: 0 }} />);
			expect(screen.getAllByRole("button")).toHaveLength(3);
		});
	});

	describe("disabled and busy", () => {
		test("root isDisabled disables every step and blocks presses", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Flow props={{ isDisabled: true, onValueChange }} />);
			for (const step of screen.getAllByRole("button")) expect(step).toBeDisabled();
			await activate(screen.getByRole("button", { name: /Shipping/ }));
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("a step's isDisabled blocks only that step", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Steps onValueChange={onValueChange}>
					<Steps.Item step={0}>Account</Steps.Item>
					<Steps.Item isDisabled step={1}>
						Shipping
					</Steps.Item>
					<Steps.Item step={2}>Payment</Steps.Item>
				</Steps>
			);
			expect(screen.getByRole("button", { name: /Shipping/ })).toBeDisabled();
			expect(screen.getByRole("button", { name: /Payment/ })).not.toBeDisabled();
			await activate(screen.getByRole("button", { name: /Shipping/ }));
			expect(onValueChange).not.toHaveBeenCalled();
			await activate(screen.getByRole("button", { name: /Payment/ }));
			expect(onValueChange).toHaveBeenCalledWith(2);
		});

		test("a loading step is busy, not disabled, and ignores presses", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Steps onValueChange={onValueChange}>
					<Steps.Item step={0}>Account</Steps.Item>
					<Steps.Item isLoading step={1}>
						Shipping
					</Steps.Item>
				</Steps>
			);
			const loading = screen.getByRole("button", { name: /Shipping/ });
			expect(loading).toBeBusy();
			expect(loading).not.toBeDisabled();
			await activate(loading);
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("isLinear blocks steps ahead of the value but not those behind", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Flow props={{ defaultValue: 1, isLinear: true, onValueChange }} />);
			expect(screen.getByRole("button", { name: /Payment/ })).toBeDisabled();
			expect(screen.getByRole("button", { name: /Account/ })).not.toBeDisabled();

			await activate(screen.getByRole("button", { name: /Payment/ }));
			expect(onValueChange).not.toHaveBeenCalled();

			await activate(screen.getByRole("button", { name: /Account/ }));
			expect(onValueChange).toHaveBeenCalledWith(0);
		});
	});

	describe("panel", () => {
		test("renders outside the trigger, so its controls are separate elements", async () => {
			await renderWithProviders(
				<Steps defaultValue={0}>
					<Steps.Item step={0}>
						Account
						<Steps.Panel>
							<Steps.Description>Panel body</Steps.Description>
						</Steps.Panel>
					</Steps.Item>
					<Steps.Item step={1}>Shipping</Steps.Item>
				</Steps>
			);
			expect(screen.getByText("Panel body")).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: /Account/ })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: /Panel body/ })).not.toBeOnTheScreen();
		});

		test("a press inside the panel does not move the stepper", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Steps defaultValue={0} onValueChange={onValueChange}>
					<Steps.Item step={0}>Account</Steps.Item>
					<Steps.Item step={1}>
						Shipping
						<Steps.Panel>
							<Steps.Title>Inner</Steps.Title>
						</Steps.Panel>
					</Steps.Item>
				</Steps>
			);
			await fireEvent(screen.getByText("Inner"), "accessibilityTap");
			expect(onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("hooks and parts outside their root", () => {
		test("useSteps and useStepsItem expose the settled state", async () => {
			function RootProbe() {
				const root = useSteps();
				return <Steps.Description>{`value ${root.value} of ${root.count}`}</Steps.Description>;
			}
			function ItemProbe() {
				const item = useStepsItem();
				return <Steps.Description>{`${item.status} ${item.step}`}</Steps.Description>;
			}
			await renderWithProviders(
				<Steps defaultValue={1}>
					<Steps.Item step={0}>
						<Steps.Title>First</Steps.Title>
						<ItemProbe />
					</Steps.Item>
					<Steps.Item step={1}>
						<Steps.Title>Second</Steps.Title>
						<ItemProbe />
						<RootProbe />
					</Steps.Item>
				</Steps>
			);
			expect(screen.getByText("value 1 of 2")).toBeOnTheScreen();
			expect(screen.getByText("completed 0")).toBeOnTheScreen();
			expect(screen.getByText("current 1")).toBeOnTheScreen();
		});

		test.each([
			["Steps.Item", <Steps.Item key="i" step={0} />, "Steps.Item must be rendered inside a <Steps>."],
			["Steps.Indicator", <Steps.Indicator key="n" />, "Steps.Indicator must be rendered inside a <Steps.Item>."],
			["Steps.Title", <Steps.Title key="t">x</Steps.Title>, "Steps.Title must be rendered inside a <Steps.Item>."],
			["Steps.Panel", <Steps.Panel key="p" />, "Steps.Panel must be rendered inside a <Steps.Item>."],
		])("%s throws outside its root", async (_name, element, message) => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			try {
				await expect(renderWithProviders(element)).rejects.toThrow(message);
			} finally {
				spy.mockRestore();
			}
		});

		test("useSteps throws outside a Steps", async () => {
			function Bare() {
				useSteps();
				return null;
			}
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			try {
				await expect(renderWithProviders(<Bare />)).rejects.toThrow("useSteps must be called inside a <Steps>.");
			} finally {
				spy.mockRestore();
			}
		});
	});
});
