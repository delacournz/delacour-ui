import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Radio } from "./radio";

const ACTIVATE = { nativeEvent: { actionName: "activate" } };

function Plans({ onSelected }: { onSelected?: (value: string) => void }): ReactElement {
	return (
		<Radio.Group accessibilityLabel="Plan" defaultSelected="free" onSelected={onSelected}>
			<Radio value="free">Free</Radio>
			<Radio value="pro">Pro</Radio>
		</Radio.Group>
	);
}

describe("Radio", () => {
	let errorSpy: ReturnType<typeof jest.spyOn>;

	beforeEach(() => {
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => {
		errorSpy.mockRestore();
	});

	test("is a radio named by its label text", async () => {
		await renderWithProviders(<Radio isSelected={false}>Express</Radio>);
		const radio = screen.getByRole("radio", { name: "Express" });
		expect(radio).toBeOnTheScreen();
		expect(radio).not.toBeChecked();
	});

	test("an icon-only radio is named by accessibilityLabel", async () => {
		await renderWithProviders(<Radio accessibilityLabel="Express delivery" />);
		expect(screen.getByRole("radio", { name: "Express delivery" })).toBeOnTheScreen();
	});

	describe("standalone", () => {
		test("isSelected is announced as checked", async () => {
			await renderWithProviders(<Radio isSelected>Express</Radio>);
			expect(screen.getByRole("radio")).toBeChecked();
		});

		test("defaultSelected is ignored: the radio follows isSelected only", async () => {
			await renderWithProviders(<Radio defaultSelected>Express</Radio>);
			expect(screen.getByRole("radio")).not.toBeChecked();
		});

		test("an activation calls onSelected(true) and waits for the prop", async () => {
			const onSelected = jest.fn();
			const view = await renderWithProviders(
				<Radio isSelected={false} onSelected={onSelected}>
					Express
				</Radio>
			);
			await fireEvent(screen.getByRole("radio"), "accessibilityTap");
			expect(onSelected).toHaveBeenCalledTimes(1);
			expect(onSelected).toHaveBeenCalledWith(true);
			expect(screen.getByRole("radio")).not.toBeChecked();

			await view.rerender(
				<Radio isSelected onSelected={onSelected}>
					Express
				</Radio>
			);
			expect(screen.getByRole("radio")).toBeChecked();
		});

		test("an already selected radio does not deselect or re-notify", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(
				<Radio isSelected onSelected={onSelected}>
					Express
				</Radio>
			);
			await fireEvent(screen.getByRole("radio"), "accessibilityTap");
			expect(onSelected).not.toHaveBeenCalled();
			expect(screen.getByRole("radio")).toBeChecked();
		});

		test("onPress fires on every activation, selected or not", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Radio isSelected onPress={onPress}>
					Express
				</Radio>
			);
			await fireEvent(screen.getByRole("radio"), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("isDisabled is announced and ignores every activation path", async () => {
			const onSelected = jest.fn();
			const onPress = jest.fn();
			await renderWithProviders(
				<Radio isDisabled isSelected={false} onPress={onPress} onSelected={onSelected}>
					Express
				</Radio>
			);
			const radio = screen.getByRole("radio");
			expect(radio).toBeDisabled();
			await fireEvent(radio, "accessibilityTap");
			await fireEvent(radio, "accessibilityAction", ACTIVATE);
			expect(onSelected).not.toHaveBeenCalled();
			expect(onPress).not.toHaveBeenCalled();
		});
	});

	describe("Radio.Group", () => {
		test("renders a radiogroup holding one radio per option, the selected one checked", async () => {
			await renderWithProviders(<Plans />);
			expect(screen.getByLabelText("Plan")).toBeOnTheScreen();
			expect(screen.getAllByRole("radio")).toHaveLength(2);
			expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
		});

		test("uncontrolled: an activation moves the selection and reports the value", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(<Plans onSelected={onSelected} />);
			await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
			expect(onSelected).toHaveBeenCalledTimes(1);
			expect(onSelected).toHaveBeenCalledWith("pro");
			expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
		});

		test("re-activating the current selection does not call onSelected", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(<Plans onSelected={onSelected} />);
			await fireEvent(screen.getByRole("radio", { name: "Free" }), "accessibilityAction", ACTIVATE);
			expect(onSelected).not.toHaveBeenCalled();
			expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
		});

		test("controlled: reports the value and waits for the prop", async () => {
			const onSelected = jest.fn();
			const view = await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" onSelected={onSelected} selected="free">
					<Radio value="free">Free</Radio>
					<Radio value="pro">Pro</Radio>
				</Radio.Group>
			);
			await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
			expect(onSelected).toHaveBeenCalledWith("pro");
			expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();

			await view.rerender(
				<Radio.Group accessibilityLabel="Plan" onSelected={onSelected} selected="pro">
					<Radio value="free">Free</Radio>
					<Radio value="pro">Pro</Radio>
				</Radio.Group>
			);
			expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
		});

		test("controlled with null: nothing is selected", async () => {
			await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" selected={null}>
					<Radio value="free">Free</Radio>
					<Radio value="pro">Pro</Radio>
				</Radio.Group>
			);
			expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
			expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
		});

		test("the group owns selection: a radio's own isSelected and onSelected are ignored", async () => {
			const own = jest.fn();
			const onSelected = jest.fn();
			await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" defaultSelected="free" onSelected={onSelected}>
					<Radio value="free">Free</Radio>
					<Radio isSelected onSelected={own} value="pro">
						Pro
					</Radio>
				</Radio.Group>
			);
			expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
			await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
			expect(own).not.toHaveBeenCalled();
			expect(onSelected).toHaveBeenCalledWith("pro");
		});

		test("a disabled group announces every radio disabled and ignores every activation path", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" defaultSelected="free" isDisabled onSelected={onSelected}>
					<Radio value="free">Free</Radio>
					<Radio value="pro">Pro</Radio>
				</Radio.Group>
			);
			const pro = screen.getByRole("radio", { name: "Pro" });
			expect(pro).toBeDisabled();
			expect(screen.getByRole("radio", { name: "Free" })).toBeDisabled();
			await fireEvent(pro, "accessibilityTap");
			await fireEvent(pro, "accessibilityAction", ACTIVATE);
			expect(onSelected).not.toHaveBeenCalled();
			expect(pro).not.toBeChecked();
			expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
		});

		test("one disabled option refuses activation while its siblings still select", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" defaultSelected="free" onSelected={onSelected}>
					<Radio value="free">Free</Radio>
					<Radio isDisabled value="pro">
						Pro
					</Radio>
					<Radio value="team">Team</Radio>
				</Radio.Group>
			);
			const pro = screen.getByRole("radio", { name: "Pro" });
			expect(pro).toBeDisabled();
			expect(screen.getByRole("radio", { name: "Team" })).not.toBeDisabled();

			await fireEvent(pro, "accessibilityTap");
			await fireEvent(pro, "accessibilityAction", ACTIVATE);
			expect(onSelected).not.toHaveBeenCalled();

			await fireEvent(screen.getByRole("radio", { name: "Team" }), "accessibilityTap");
			expect(onSelected).toHaveBeenCalledWith("team");
		});

		test("an explicit isDisabled={false} on the group beats a disabled Field", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Radio.Group accessibilityLabel="Plan" isDisabled={false}>
						<Radio value="free">Free</Radio>
					</Radio.Group>
				</Field>
			);
			expect(screen.getByRole("radio")).not.toBeDisabled();
		});

		test("a radio without a value warns and can never be selected", async () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
			const onSelected = jest.fn();
			await renderWithProviders(
				<Radio.Group accessibilityLabel="Plan" onSelected={onSelected}>
					<Radio>Nameless</Radio>
				</Radio.Group>
			);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs a `value`"));
			await fireEvent(screen.getByRole("radio"), "accessibilityTap");
			expect(onSelected).not.toHaveBeenCalled();
			expect(screen.getByRole("radio")).not.toBeChecked();
			warn.mockRestore();
		});
	});

	describe("Field", () => {
		test("a disabled Field disables a standalone radio and ignores activation", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(
				<Field isDisabled>
					<Radio isSelected={false} onSelected={onSelected}>
						Express
					</Radio>
				</Field>
			);
			const radio = screen.getByRole("radio");
			expect(radio).toBeDisabled();
			await fireEvent(radio, "accessibilityTap");
			await fireEvent(radio, "accessibilityAction", ACTIVATE);
			expect(onSelected).not.toHaveBeenCalled();
		});

		test("a disabled Field disables a whole group", async () => {
			const onSelected = jest.fn();
			await renderWithProviders(
				<Field isDisabled>
					<Radio.Group accessibilityLabel="Plan" onSelected={onSelected}>
						<Radio value="free">Free</Radio>
					</Radio.Group>
				</Field>
			);
			const radio = screen.getByRole("radio");
			expect(radio).toBeDisabled();
			await fireEvent(radio, "accessibilityTap");
			expect(onSelected).not.toHaveBeenCalled();
		});

		test("an own isDisabled={false} beats a disabled Field", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Radio isDisabled={false}>Express</Radio>
				</Field>
			);
			expect(screen.getByRole("radio")).not.toBeDisabled();
		});
	});

	describe("Field validity", () => {
		test("each radio is named by its text plus required, and carries the error and description", async () => {
			await renderWithProviders(
				<Field isInvalid isRequired>
					<Field.Label>Plan</Field.Label>
					<Radio.Group>
						<Radio value="free">Free</Radio>
						<Radio value="pro">Pro</Radio>
					</Radio.Group>
					<Field.Description>Billed monthly.</Field.Description>
					<Field.Error>Pick a plan</Field.Error>
				</Field>
			);
			const radio = screen.getByRole("radio", { name: "Free, required" });
			expect(radio).toHaveProp("accessibilityHint", "Invalid: Pick a plan. Billed monthly.");
			expect(screen.getByRole("radio", { name: "Pro, required" })).toBeOnTheScreen();
		});

		test("Field.Label stays readable as the group's heading", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Plan</Field.Label>
					<Radio.Group>
						<Radio value="free">Free</Radio>
					</Radio.Group>
				</Field>
			);
			const label = screen.getByText("Plan");
			expect(label.props.importantForAccessibility).not.toBe("no-hide-descendants");
		});

		test("a standalone text-less radio takes the field's label and hides it", async () => {
			await renderWithProviders(
				<Field isRequired>
					<Field.Label>Express</Field.Label>
					<Radio isSelected={false} />
				</Field>
			);
			expect(screen.getByRole("radio", { name: "Express, required" })).toBeOnTheScreen();
			expect(screen.getByText(/Express/, { includeHiddenElements: true })).toHaveProp(
				"importantForAccessibility",
				"no-hide-descendants"
			);
		});

		test("outside a Field the name and hint are the caller's own", async () => {
			await renderWithProviders(
				<Radio accessibilityHint="Ships tomorrow" isSelected={false}>
					Express
				</Radio>
			);
			const radio = screen.getByRole("radio", { name: "Express" });
			expect(radio).toHaveProp("accessibilityHint", "Ships tomorrow");
		});
	});

	describe("compound parts", () => {
		test("Radio.Label and Radio.Indicator render inside a Radio", async () => {
			await renderWithProviders(
				<Radio isSelected>
					<Radio.Indicator />
					<Radio.Label>Express</Radio.Label>
				</Radio>
			);
			expect(screen.getByRole("radio", { name: "Express" })).toBeOnTheScreen();
			expect(screen.getByText("Express")).toBeOnTheScreen();
		});

		test("bare string children become one label", async () => {
			await renderWithProviders(
				<Radio>
					{"Plan "}
					{2}
				</Radio>
			);
			expect(screen.getByText("Plan 2")).toBeOnTheScreen();
		});

		test("Radio.Label outside a Radio throws its documented error", async () => {
			await expect(renderWithProviders(<Radio.Label>Orphan</Radio.Label>)).rejects.toThrow(
				"Radio.Label must be rendered inside a <Radio>."
			);
		});

		test("Radio.Indicator outside a Radio throws its documented error", async () => {
			await expect(renderWithProviders(<Radio.Indicator />)).rejects.toThrow(
				"Radio.Indicator must be rendered inside a <Radio>."
			);
		});
	});
});
