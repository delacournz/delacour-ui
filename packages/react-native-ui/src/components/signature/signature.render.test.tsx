import { describe, expect, jest, test } from "@jest/globals";
import { createRef } from "react";
import { AccessibilityInfo } from "react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Signature } from "./signature";
import type { SignatureHandle, SignatureValue } from "./signature.types";
import { SIGNATURE_PAD_GESTURE_ID } from "./signature-pad";

const TWO_STROKES: SignatureValue = {
	width: 200,
	height: 100,
	strokes: [
		[
			{ x: 10, y: 10 },
			{ x: 50, y: 40 },
		],
		[
			{ x: 60, y: 20 },
			{ x: 90, y: 60 },
		],
	],
};

const ONE_STROKE: SignatureValue = { width: 200, height: 100, strokes: [TWO_STROKES.strokes[0] ?? []] };

/** Draws one stroke by driving the pad's pan the way Gesture Handler would. */
async function drawStroke(): Promise<void> {
	await fireGestureHandler(getByGestureTestId(SIGNATURE_PAD_GESTURE_ID), [
		{ x: 10, y: 10 },
		{ x: 40, y: 30 },
		{ x: 80, y: 50 },
	]);
}

async function activate(name: string): Promise<void> {
	await fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
}

describe("Signature", () => {
	test("an empty pad describes itself and offers no actions", async () => {
		await renderWithProviders(<Signature />);
		const pad = screen.getByLabelText("Signature pad, empty");
		expect(pad).toBeOnTheScreen();
		expect(pad.props.accessibilityActions ?? []).toHaveLength(0);
		expect(screen.getByText("Sign here")).toBeOnTheScreen();
	});

	test("a drawn pad counts its strokes and offers undo and clear", async () => {
		await renderWithProviders(<Signature defaultValue={TWO_STROKES} />);
		const pad = screen.getByLabelText("Signature, drawn, 2 strokes");
		expect(pad).toBeOnTheScreen();
		expect(pad.props.accessibilityRole).toBe("image");
		const names = (pad.props.accessibilityActions as { name: string }[]).map((action) => action.name);
		expect(names).toEqual(["undo", "clear"]);
	});

	test("one stroke is announced in the singular", async () => {
		await renderWithProviders(<Signature defaultValue={ONE_STROKE} />);
		expect(screen.getByLabelText("Signature, drawn, 1 stroke")).toBeOnTheScreen();
	});

	test("an enclosing Field's label names the pad", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Witness</Field.Label>
				<Signature defaultValue={ONE_STROKE} />
			</Field>
		);
		expect(screen.getByLabelText("Witness, drawn, 1 stroke")).toBeOnTheScreen();
	});

	test("the toolbar disables what would do nothing", async () => {
		await renderWithProviders(
			<Signature>
				<Signature.Pad />
				<Signature.Toolbar>
					<Signature.Undo />
					<Signature.Redo />
					<Signature.Clear />
				</Signature.Toolbar>
			</Signature>
		);
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Clear signature" })).toBeDisabled();
	});

	test("a drawn stroke fires onBegin, onEnd and onValueChange once", async () => {
		const onBegin = jest.fn();
		const onEnd = jest.fn();
		const onValueChange = jest.fn();
		const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
		await renderWithProviders(<Signature onBegin={onBegin} onEnd={onEnd} onValueChange={onValueChange} />);

		await drawStroke();

		expect(onBegin).toHaveBeenCalledTimes(1);
		expect(onEnd).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		const reported = onValueChange.mock.calls[0]?.[0] as SignatureValue;
		expect(reported.strokes).toHaveLength(1);
		expect(onEnd).toHaveBeenCalledWith(reported);
		expect(announce).toHaveBeenCalledWith("Signature captured");
		expect(await screen.findByLabelText("Signature, drawn, 1 stroke")).toBeOnTheScreen();
		announce.mockRestore();
	});

	test("a disabled pad takes no stroke", async () => {
		const onEnd = jest.fn();
		await renderWithProviders(<Signature isDisabled onEnd={onEnd} />);
		expect(screen.getByLabelText("Signature pad, empty")).toBeDisabled();
		await drawStroke();
		expect(onEnd).not.toHaveBeenCalled();
		expect(screen.getByLabelText("Signature pad, empty")).toBeOnTheScreen();
	});

	test("undo, redo and clear through the toolbar report and update the pad", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Signature defaultValue={TWO_STROKES} onValueChange={onValueChange}>
				<Signature.Pad />
				<Signature.Toolbar>
					<Signature.Undo />
					<Signature.Redo />
					<Signature.Clear />
				</Signature.Toolbar>
			</Signature>
		);

		await activate("Undo");
		expect(screen.getByLabelText("Signature, drawn, 1 stroke")).toBeOnTheScreen();
		const last = onValueChange.mock.lastCall?.[0] as SignatureValue | null;
		expect(last?.strokes).toHaveLength(1);
		expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled();

		await activate("Redo");
		expect(screen.getByLabelText("Signature, drawn, 2 strokes")).toBeOnTheScreen();

		const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
		await activate("Clear signature");
		expect(screen.getByLabelText("Signature pad, empty")).toBeOnTheScreen();
		expect(onValueChange).toHaveBeenLastCalledWith(null);
		expect(announce).toHaveBeenCalledWith("Signature cleared");
		expect(screen.getByRole("button", { name: "Clear signature" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
		announce.mockRestore();
	});

	test("the pad's custom accessibility actions run undo and clear", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Signature defaultValue={TWO_STROKES} onValueChange={onValueChange} />);

		await fireEvent(screen.getByLabelText("Signature, drawn, 2 strokes"), "accessibilityAction", {
			nativeEvent: { actionName: "undo" },
		});
		expect(screen.getByLabelText("Signature, drawn, 1 stroke")).toBeOnTheScreen();

		await fireEvent(screen.getByLabelText("Signature, drawn, 1 stroke"), "accessibilityAction", {
			nativeEvent: { actionName: "clear" },
		});
		expect(screen.getByLabelText("Signature pad, empty")).toBeOnTheScreen();
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	test("a disabled pad ignores accessibility actions and toolbar presses", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Signature defaultValue={TWO_STROKES} isDisabled onValueChange={onValueChange} />);
		const pad = screen.getByLabelText("Signature, drawn, 2 strokes");
		expect(pad.props.accessibilityActions ?? []).toHaveLength(0);
		await fireEvent(pad, "accessibilityAction", { nativeEvent: { actionName: "clear" } });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Clear signature" })).toBeDisabled();
	});

	test("read-only shows the drawing with no toolbar, hint or actions", async () => {
		await renderWithProviders(
			<Signature defaultValue={TWO_STROKES} isReadOnly onRequestAlternative={() => undefined} />
		);
		const pad = screen.getByLabelText("Signature, drawn, 2 strokes");
		expect(pad.props.accessibilityHint).toBeUndefined();
		expect(pad.props.accessibilityActions ?? []).toHaveLength(0);
		expect(screen.queryByRole("button", { name: "Undo" })).not.toBeOnTheScreen();
		expect(screen.queryByText("Can't sign? Type your name")).not.toBeOnTheScreen();
	});

	test("an interactive pad carries the drawing hint", async () => {
		await renderWithProviders(<Signature />);
		expect(screen.getByLabelText("Signature pad, empty").props.accessibilityHint).toBe(
			"Double tap and hold, then drag to draw."
		);
	});

	test("uncontrolled: defaultValue seeds it and the ref reads it back", async () => {
		const ref = createRef<SignatureHandle>();
		await renderWithProviders(<Signature defaultValue={TWO_STROKES} ref={ref} />);
		expect(ref.current?.isEmpty).toBe(false);
		expect(ref.current?.strokeCount).toBe(2);
		expect(ref.current?.value?.strokes).toHaveLength(2);
		expect(ref.current?.toPaths()).toHaveLength(2);
		expect(ref.current?.toSVG()).toContain("<svg");

		await act(async () => ref.current?.clear());
		expect(ref.current?.isEmpty).toBe(true);
		expect(ref.current?.value).toBeNull();
	});

	test("controlled: a new value re-seeds the drawing and does not echo onValueChange", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Signature onValueChange={onValueChange} value={ONE_STROKE} />);
		expect(screen.getByLabelText("Signature, drawn, 1 stroke")).toBeOnTheScreen();

		await view.rerender(<Signature onValueChange={onValueChange} value={TWO_STROKES} />);
		expect(screen.getByLabelText("Signature, drawn, 2 strokes")).toBeOnTheScreen();

		await view.rerender(<Signature onValueChange={onValueChange} value={null} />);
		expect(screen.getByLabelText("Signature pad, empty")).toBeOnTheScreen();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("Signature.Alternative renders only with onRequestAlternative and calls it, even disabled", async () => {
		const onRequestAlternative = jest.fn();
		const view = await renderWithProviders(<Signature />);
		expect(screen.queryByText("Can't sign? Type your name")).not.toBeOnTheScreen();

		await view.rerender(<Signature isDisabled onRequestAlternative={onRequestAlternative} />);
		const link = screen.getByRole("button", { name: "Can't sign? Type your name" });
		expect(link).toBeEnabled();
		await fireEvent(link, "accessibilityTap");
		expect(onRequestAlternative).toHaveBeenCalledTimes(1);
	});

	test("placeholder and guideline label are configurable", async () => {
		await renderWithProviders(<Signature guidelineLabel="Sign above the line" placeholder="Sign in the box" />);
		expect(screen.getByText("Sign in the box")).toBeOnTheScreen();
		expect(screen.getByText("Sign above the line")).toBeOnTheScreen();
	});

	test.each([
		["Signature.Pad", <Signature.Pad key="pad" />],
		["Signature.Toolbar", <Signature.Toolbar key="toolbar" />],
		["Signature.Undo", <Signature.Undo key="undo" />],
		["Signature.Redo", <Signature.Redo key="redo" />],
		["Signature.Clear", <Signature.Clear key="clear" />],
		["Signature.Alternative", <Signature.Alternative key="alt" />],
	])("%s outside a Signature throws its documented error", async (name, part) => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <Signature>.`);
		} finally {
			console.error = original;
		}
	});
});
