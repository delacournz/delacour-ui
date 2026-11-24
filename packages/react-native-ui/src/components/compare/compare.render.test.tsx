import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Field } from "../field";
import { Compare } from "./compare";

type ComparisonProps = Omit<React.ComponentProps<typeof Compare>, "children">;

function Comparison(props: ComparisonProps) {
	return (
		<Compare accessibilityLabel="Retouch" className="h-40" {...props}>
			<Compare.Before testID="before">
				<Text>Original photo</Text>
			</Compare.Before>
			<Compare.After testID="after">
				<Text>Retouched photo</Text>
			</Compare.After>
			<Compare.Handle />
		</Compare>
	);
}

async function step(direction: "increment" | "decrement"): Promise<void> {
	await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", { nativeEvent: { actionName: direction } });
}

describe("Compare", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("the handle is an adjustable with its name and the Before share as its value", async () => {
		await renderWithProviders(<Comparison />);
		const handle = screen.getByRole("adjustable", { name: "Retouch" });
		expect(handle).toBeOnTheScreen();
		expect(handle).toHaveAccessibilityValue({ min: 0, max: 100, now: 50, text: "50 percent before" });
	});

	test("both layers' content is reachable", async () => {
		await renderWithProviders(<Comparison />);
		expect(screen.getByText("Original photo")).toBeOnTheScreen();
		expect(screen.getByText("Retouched photo")).toBeOnTheScreen();
	});

	test("an enclosing Field.Label names the handle", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Skin tone</Field.Label>
				<Comparison accessibilityLabel={undefined} />
			</Field>
		);
		expect(screen.getByRole("adjustable", { name: "Skin tone" })).toBeOnTheScreen();
	});

	test("an unnamed handle warns in development", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<Comparison accessibilityLabel={undefined} />);
		await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining("unnamed adjustable")));
	});

	test("a named handle does not warn", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<Comparison />);
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(warn).not.toHaveBeenCalled();
	});

	test("string labels name their sides in the value text and stay hidden from assistive tech", async () => {
		await renderWithProviders(
			<Compare accessibilityLabel="Retouch" className="h-40">
				<Compare.Before>
					<Text>b</Text>
				</Compare.Before>
				<Compare.After>
					<Text>a</Text>
				</Compare.After>
				<Compare.Label side="before">Original</Compare.Label>
				<Compare.Label side="after">Retouched</Compare.Label>
				<Compare.Handle />
			</Compare>
		);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ text: "50 percent Original" });
		expect(screen.queryByText("Original")).not.toBeOnTheScreen();
		expect(screen.getByText("Original", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	describe("assistive stepping", () => {
		test("increment and decrement move the position by step and fire both callbacks", async () => {
			const onPositionChange = jest.fn();
			const onPositionChangeEnd = jest.fn();
			await renderWithProviders(
				<Comparison
					defaultPosition={0.5}
					onPositionChange={onPositionChange}
					onPositionChangeEnd={onPositionChangeEnd}
				/>
			);

			await step("increment");
			expect(onPositionChange).toHaveBeenLastCalledWith(0.6);
			expect(onPositionChangeEnd).toHaveBeenLastCalledWith(0.6);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 60, text: "60 percent before" });

			await step("decrement");
			await step("decrement");
			expect(onPositionChange).toHaveBeenLastCalledWith(0.4);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 40 });
			expect(onPositionChangeEnd).toHaveBeenCalledTimes(3);
		});

		test("a custom step is honoured", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.5} step={0.25} />);
			await step("increment");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 75 });
		});

		test("stepping stops at 1 and reads Showing only before", async () => {
			const onPositionChange = jest.fn();
			await renderWithProviders(<Comparison defaultPosition={0.95} onPositionChange={onPositionChange} />);
			await step("increment");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 100, text: "Showing only before" });
			onPositionChange.mockClear();
			await step("increment");
			expect(onPositionChange).not.toHaveBeenCalled();
		});

		test("stepping stops at 0 and reads Showing only after", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.05} />);
			await step("decrement");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0, text: "Showing only after" });
		});

		test("minPosition and maxPosition bound the steps", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.5} minPosition={0.3} maxPosition={0.6} />);
			await step("increment");
			await step("increment");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 60 });
			for (let i = 0; i < 5; i++) await step("decrement");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 30 });
		});

		test("defaultPosition outside the bounds is clamped", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.9} maxPosition={0.7} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 70 });
		});

		test("a step landing near a snap point is pulled onto it", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.5} snapPoints={[0.62]} snapThreshold={0.05} />);
			await step("increment");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 62 });
		});
	});

	describe("controlled and uncontrolled", () => {
		test("uncontrolled: defaultPosition seeds it and the handle changes itself", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.2} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 20 });
			await step("increment");
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 30 });
		});

		test("controlled: reports the step and waits for the prop", async () => {
			const onPositionChange = jest.fn();
			const view = await renderWithProviders(<Comparison onPositionChange={onPositionChange} position={0.5} />);
			await step("increment");
			expect(onPositionChange).toHaveBeenCalledWith(0.6);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 50 });

			await view.rerender(<Comparison onPositionChange={onPositionChange} position={0.6} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 60, text: "60 percent before" });
		});
	});

	describe("covered layers", () => {
		test("Before leaves the accessibility tree at 0", async () => {
			await renderWithProviders(<Comparison defaultPosition={0} />);
			expect(screen.getByTestId("before", { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"no-hide-descendants"
			);
			expect(screen.getByTestId("after", { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"auto"
			);
		});

		test("After leaves the accessibility tree at 1", async () => {
			await renderWithProviders(<Comparison defaultPosition={1} />);
			expect(screen.getByTestId("after", { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"no-hide-descendants"
			);
			expect(screen.getByTestId("before", { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"auto"
			);
		});

		test("stepping to an extreme hides the covered layer", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.95} />);
			await step("increment");
			expect(screen.getByTestId("after", { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"no-hide-descendants"
			);
		});
	});

	describe("isDisabled", () => {
		test("is announced and ignores assistive actions", async () => {
			const onPositionChange = jest.fn();
			const onPositionChangeEnd = jest.fn();
			await renderWithProviders(
				<Comparison isDisabled onPositionChange={onPositionChange} onPositionChangeEnd={onPositionChangeEnd} />
			);
			expect(screen.getByRole("adjustable")).toBeDisabled();
			await step("increment");
			await step("decrement");
			expect(onPositionChange).not.toHaveBeenCalled();
			expect(onPositionChangeEnd).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 50 });
		});

		test("is inherited from an enclosing disabled Field", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Comparison />
				</Field>
			);
			expect(screen.getByRole("adjustable")).toBeDisabled();
		});

		test("an enabled handle is not disabled", async () => {
			await renderWithProviders(<Comparison />);
			expect(screen.getByRole("adjustable")).not.toBeDisabled();
		});
	});

	describe("orientation", () => {
		test("a vertical comparison keeps the same adjustable semantics", async () => {
			await renderWithProviders(<Comparison defaultPosition={0.5} orientation="vertical" />);
			await step("decrement");
			expect(screen.getByRole("adjustable", { name: "Retouch" })).toHaveAccessibilityValue({ now: 40 });
		});
	});

	describe("compound parts outside a Compare", () => {
		const parts: ReadonlyArray<[string, () => React.ReactElement]> = [
			["Compare.Before", () => <Compare.Before>{null}</Compare.Before>],
			["Compare.After", () => <Compare.After>{null}</Compare.After>],
			["Compare.Handle", () => <Compare.Handle />],
			["Compare.Label", () => <Compare.Label side="before">Original</Compare.Label>],
		];

		test.each(parts)("%s throws its documented error", async (name, part) => {
			const original = console.error;
			console.error = () => undefined;
			try {
				await expect(renderWithProviders(part())).rejects.toThrow(`${name} must be rendered inside a <Compare>.`);
			} finally {
				console.error = original;
			}
		});
	});
});
