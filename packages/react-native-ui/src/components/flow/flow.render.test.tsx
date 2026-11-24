import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Text } from "../text";
import { FLOW_DEFAULTS } from "./flow.variants";
import { Flow, useFlow } from "./index";

const ACTIVATE = { nativeEvent: { actionName: "activate" } };

function action(actionName: string) {
	return { nativeEvent: { actionName } };
}

/** Two nodes joined by a source and a target handle, the smallest graph that offers a connection. */
function Pair({
	onConnect,
	isValidConnection,
	onNodeDragEnd,
	onPressA,
	onDeleteA,
}: {
	onConnect?: (connection: unknown) => void;
	isValidConnection?: (connection: { source: string; target: string }) => boolean;
	onNodeDragEnd?: (id: string, position: { x: number; y: number }) => void;
	onPressA?: () => void;
	onDeleteA?: () => void;
}): ReactElement {
	return (
		<Flow isValidConnection={isValidConnection} onConnect={onConnect} onNodeDragEnd={onNodeDragEnd}>
			<Flow.Node accessibilityLabel="Source" id="a" onDelete={onDeleteA} onPress={onPressA} position={{ x: 10, y: 20 }}>
				<Text>Source</Text>
				<Flow.Handle id="out" />
			</Flow.Node>
			<Flow.Node accessibilityLabel="Sink" id="b" position={{ x: 300, y: 20 }}>
				<Text>Sink</Text>
				<Flow.Handle id="in" side="left" type="target" />
			</Flow.Node>
			<Flow.Edge from="a.out" to="b.in" />
		</Flow>
	);
}

function actionNames(element: { props: Record<string, unknown> }): string[] {
	const actions = (element.props.accessibilityActions ?? []) as { name: string }[];
	return actions.map((candidate) => candidate.name);
}

describe("Flow", () => {
	test("renders its nodes as labelled accessible elements, defaulting the label to the id", async () => {
		await renderWithProviders(
			<Flow testID="canvas">
				<Flow.Node accessibilityLabel="Trigger" id="trigger" position={{ x: 0, y: 0 }}>
					<Text>Trigger</Text>
				</Flow.Node>
				<Flow.Node id="plain" position={{ x: 200, y: 0 }}>
					<Text>Plain</Text>
				</Flow.Node>
			</Flow>
		);
		expect(screen.getByTestId("canvas")).toBeOnTheScreen();
		expect(screen.getByLabelText("Trigger")).toBeOnTheScreen();
		expect(screen.getByLabelText("plain")).toBeOnTheScreen();
	});

	test("isSelected is announced as selected state", async () => {
		const view = await renderWithProviders(
			<Flow>
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }} />
			</Flow>
		);
		expect(screen.getByLabelText("Step")).not.toBeSelected();
		await view.rerender(
			<Flow>
				<Flow.Node accessibilityLabel="Step" id="a" isSelected position={{ x: 0, y: 0 }} />
			</Flow>
		);
		expect(screen.getByLabelText("Step")).toBeSelected();
	});

	test("the Skia layer and handles are hidden from assistive technology", async () => {
		await renderWithProviders(
			<Flow>
				<Flow.Background />
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }}>
					<Flow.Handle id="out" testID="handle" />
				</Flow.Node>
			</Flow>
		);
		expect(screen.getByTestId("handle", { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
		expect(screen.queryByTestId("handle")).not.toBeOnTheScreen();
	});

	test("a node offers activate, the four moves and delete only for the callbacks it was given", async () => {
		const view = await renderWithProviders(<Pair />);
		expect(actionNames(screen.getByLabelText("Source"))).toEqual([
			"moveUp",
			"moveDown",
			"moveLeft",
			"moveRight",
			"connect-0",
		]);

		await view.rerender(<Pair onDeleteA={jest.fn()} onPressA={jest.fn()} />);
		expect(actionNames(screen.getByLabelText("Source"))).toEqual([
			"activate",
			"moveUp",
			"moveDown",
			"moveLeft",
			"moveRight",
			"connect-0",
			"delete",
		]);
	});

	test("activate and delete call onPress and onDelete", async () => {
		const onPress = jest.fn();
		const onDelete = jest.fn();
		await renderWithProviders(<Pair onDeleteA={onDelete} onPressA={onPress} />);
		const node = screen.getByLabelText("Source");

		await fireEvent(node, "accessibilityAction", ACTIVATE);
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onDelete).not.toHaveBeenCalled();

		await fireEvent(node, "accessibilityAction", action("delete"));
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	test("an assistive move reports the shifted position through onNodeDragEnd", async () => {
		const onNodeDragEnd = jest.fn();
		await renderWithProviders(<Pair onNodeDragEnd={onNodeDragEnd} />);
		const node = screen.getByLabelText("Source");

		await fireEvent(node, "accessibilityAction", action("moveRight"));
		const step = FLOW_DEFAULTS.accessibilityMoveStep;
		expect(onNodeDragEnd).toHaveBeenLastCalledWith("a", { x: 10 + step, y: 20 });
		await fireEvent(node, "accessibilityAction", action("moveUp"));
		expect(onNodeDragEnd).toHaveBeenLastCalledWith("a", { x: 10 + step, y: 20 - step });
	});

	test("accessibilityMoveStep sets how far one move shifts the node", async () => {
		const onNodeDragEnd = jest.fn();
		await renderWithProviders(
			<Flow onNodeDragEnd={onNodeDragEnd}>
				<Flow.Node accessibilityLabel="Step" accessibilityMoveStep={50} id="a" position={{ x: 0, y: 0 }} />
			</Flow>
		);
		await fireEvent(screen.getByLabelText("Step"), "accessibilityAction", action("moveDown"));
		expect(onNodeDragEnd).toHaveBeenCalledWith("a", { x: 0, y: 50 });
	});

	test("a node that cannot be dragged offers no move actions", async () => {
		const view = await renderWithProviders(
			<Flow>
				<Flow.Node accessibilityLabel="Fixed" id="a" isDraggable={false} position={{ x: 0, y: 0 }} />
			</Flow>
		);
		expect(actionNames(screen.getByLabelText("Fixed"))).toEqual([]);

		await view.rerender(
			<Flow>
				<Flow.Node accessibilityLabel="Fixed" id="a" isPinned position={{ x: 0, y: 0 }} />
			</Flow>
		);
		expect(actionNames(screen.getByLabelText("Fixed"))).toEqual([]);
	});

	test("a connect action names the pairing and calls onConnect with it", async () => {
		const onConnect = jest.fn();
		await renderWithProviders(<Pair onConnect={onConnect} />);
		const node = screen.getByLabelText("Source");
		const actions = node.props.accessibilityActions as { name: string; label: string }[];
		expect(actions.find((candidate) => candidate.name === "connect-0")?.label).toBe("Connect out to Sink");

		await fireEvent(node, "accessibilityAction", action("connect-0"));
		expect(onConnect).toHaveBeenCalledWith({ source: "a", sourceHandle: "out", target: "b", targetHandle: "in" });
	});

	test("isValidConnection removes the connect action and refuses the connection", async () => {
		const onConnect = jest.fn();
		await renderWithProviders(<Pair isValidConnection={() => false} onConnect={onConnect} />);
		const node = screen.getByLabelText("Source");
		expect(actionNames(node)).not.toContain("connect-0");

		await fireEvent(node, "accessibilityAction", action("connect-0"));
		expect(onConnect).not.toHaveBeenCalled();
	});

	test("a locked canvas takes the move actions away", async () => {
		await renderWithProviders(
			<Flow>
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }} />
				<Flow.Controls />
			</Flow>
		);
		expect(actionNames(screen.getByLabelText("Step"))).toContain("moveUp");
		await fireEvent(screen.getByRole("button", { name: "Lock canvas" }), "accessibilityTap");
		expect(actionNames(screen.getByLabelText("Step"))).not.toContain("moveUp");
	});

	test("a group with a label is a named element and renders its nodes", async () => {
		await renderWithProviders(
			<Flow>
				<Flow.Group id="g" label="Stage one" position={{ x: 0, y: 0 }} size={{ height: 200, width: 300 }}>
					<Flow.Node accessibilityLabel="Inside" id="a" position={{ x: 10, y: 30 }} />
				</Flow.Group>
			</Flow>
		);
		expect(screen.getByLabelText("Stage one")).toBeOnTheScreen();
		expect(screen.getByLabelText("Inside")).toBeOnTheScreen();
	});

	test("Controls: labelled buttons, each part switchable off", async () => {
		const view = await renderWithProviders(
			<Flow>
				<Flow.Controls />
			</Flow>
		);
		for (const name of ["Zoom in", "Zoom out", "Fit to view", "Lock canvas"]) {
			expect(screen.getByRole("button", { name })).toBeOnTheScreen();
		}

		await view.rerender(
			<Flow>
				<Flow.Controls showFit={false} showLock={false} showZoom={false} />
			</Flow>
		);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("Controls: zoom in and zoom out report a viewport scaled by step", async () => {
		const onViewportChange = jest.fn();
		await renderWithProviders(
			<Flow onViewportChange={onViewportChange}>
				<Flow.Controls step={2} />
			</Flow>
		);
		await fireEvent(screen.getByRole("button", { name: "Zoom in" }), "accessibilityTap");
		expect(onViewportChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 2 }));
		await fireEvent(screen.getByRole("button", { name: "Zoom out" }), "accessibilityTap");
		expect(onViewportChange).toHaveBeenCalledTimes(2);
		const zoomedOut = onViewportChange.mock.calls[1]?.[0] as { zoom: number };
		expect(zoomedOut.zoom).toBeLessThan(1);
	});

	test("Controls: fit reports a viewport", async () => {
		const onViewportChange = jest.fn();
		await renderWithProviders(
			<Flow onViewportChange={onViewportChange}>
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }} />
				<Flow.Controls />
			</Flow>
		);
		await fireEvent(screen.getByRole("button", { name: "Fit to view" }), "accessibilityTap");
		expect(onViewportChange).toHaveBeenCalledTimes(1);
	});

	test("Controls: lock reports selected, disables zoom and fit, and unlocks again", async () => {
		const onViewportChange = jest.fn();
		await renderWithProviders(
			<Flow onViewportChange={onViewportChange}>
				<Flow.Controls />
			</Flow>
		);
		const lock = screen.getByRole("button", { name: "Lock canvas" });
		expect(lock).not.toBeSelected();

		await fireEvent(lock, "accessibilityTap");
		expect(screen.getByRole("button", { name: "Lock canvas" })).toBeSelected();
		for (const name of ["Zoom in", "Zoom out", "Fit to view"]) {
			expect(screen.getByRole("button", { name })).toBeDisabled();
		}
		await fireEvent(screen.getByRole("button", { name: "Zoom in" }), "accessibilityTap");
		expect(onViewportChange).not.toHaveBeenCalled();

		await fireEvent(screen.getByRole("button", { name: "Lock canvas" }), "accessibilityTap");
		expect(screen.getByRole("button", { name: "Lock canvas" })).not.toBeSelected();
		expect(screen.getByRole("button", { name: "Zoom in" })).not.toBeDisabled();
	});

	test("MiniMap renders without a name of its own and is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Flow>
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }} />
				<Flow.MiniMap />
			</Flow>
		);
		expect(screen.getByLabelText("Step")).toBeOnTheScreen();
	});

	test("useFlow exposes lock state and setLocked to a custom control", async () => {
		function Toggle(): ReactElement {
			const { isLocked, setLocked } = useFlow();
			return (
				<Text accessibilityRole="button" onPress={() => setLocked(!isLocked)}>
					{isLocked ? "locked" : "unlocked"}
				</Text>
			);
		}
		await renderWithProviders(
			<Flow>
				<Flow.Node accessibilityLabel="Step" id="a" position={{ x: 0, y: 0 }} />
				<Flow.Controls showFit={false} showZoom={false} />
			</Flow>
		);
		expect(screen.getByRole("button", { name: "Lock canvas" })).not.toBeSelected();

		await renderWithProviders(
			<Flow>
				<Toggle />
			</Flow>
		);
		await fireEvent.press(screen.getByText("unlocked"));
		expect(screen.getByText("locked")).toBeOnTheScreen();
	});

	describe("outside a Flow", () => {
		let errorSpy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});
		afterEach(() => {
			errorSpy.mockRestore();
		});

		test.each([
			["Flow.Node", <Flow.Node id="a" key="n" position={{ x: 0, y: 0 }} />],
			["Flow.Group", <Flow.Group id="g" key="g" position={{ x: 0, y: 0 }} size={{ height: 1, width: 1 }} />],
			["Flow.Controls", <Flow.Controls key="c" />],
			["Flow.MiniMap", <Flow.MiniMap key="m" />],
			["Flow.Edge", <Flow.Edge from="a" key="e" to="b" />],
		])("%s throws its documented error", async (part, element) => {
			await expect(renderWithProviders(element)).rejects.toThrow(`<${part}> must be rendered inside a <Flow>.`);
		});

		test("Flow.Handle outside a Flow.Node throws", async () => {
			await expect(
				renderWithProviders(
					<Flow>
						<Flow.Handle id="out" />
					</Flow>
				)
			).rejects.toThrow("<Flow.Handle> must be rendered inside a <Flow.Node>.");
		});

		test("useFlow throws by name", async () => {
			function Bad(): ReactElement {
				useFlow();
				return <Text>never</Text>;
			}
			await expect(renderWithProviders(<Bad />)).rejects.toThrow("<useFlow> must be rendered inside a <Flow>.");
		});
	});
});
