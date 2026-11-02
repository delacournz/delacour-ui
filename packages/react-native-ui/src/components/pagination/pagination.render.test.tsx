import { describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Pagination } from "./pagination";
import { usePagination } from "./pagination.context";

/** Runs `render` with `console.error` silenced, for a part that throws outside its root. */
async function withSilencedErrors(run: () => Promise<void>): Promise<void> {
	const original = console.error;
	console.error = () => undefined;
	try {
		await run();
	} finally {
		console.error = original;
	}
}

describe("Pagination", () => {
	// The toolbar root is deliberately not `accessible` (that would group and hide its targets), so
	// RNTL's role query cannot see it: its role and name are read from props.
	test("is a toolbar named Pagination, with a labelled arrow pair and a page-numbered run", async () => {
		await renderWithProviders(<Pagination count={5} />);
		const toolbar = screen.getByLabelText("Pagination");
		expect(toolbar.props.accessibilityRole).toBe("toolbar");
		expect(screen.getByRole("button", { name: "Previous page" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Next page" })).toBeOnTheScreen();
		for (const page of [1, 2, 3, 4, 5]) {
			expect(screen.getByRole("button", { name: `Page ${page}` })).toBeOnTheScreen();
		}
	});

	test("accessibilityLabel renames the toolbar", async () => {
		await renderWithProviders(<Pagination accessibilityLabel="Orders" count={3} />);
		expect(screen.getByLabelText("Orders").props.accessibilityRole).toBe("toolbar");
	});

	test("the current page is announced selected and the others are not", async () => {
		await renderWithProviders(<Pagination count={5} defaultPage={3} />);
		expect(screen.getByRole("button", { name: "Page 3" })).toBeSelected();
		expect(screen.getByRole("button", { name: "Page 2" })).not.toBeSelected();
	});

	test("Previous is disabled on the first page and Next on the last", async () => {
		const view = await renderWithProviders(<Pagination count={3} page={1} />);
		expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

		await view.rerender(<Pagination count={3} page={3} />);
		expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
	});

	test("hasControls={false} drops the arrows", async () => {
		await renderWithProviders(<Pagination count={3} hasControls={false} />);
		expect(screen.queryByRole("button", { name: "Previous page" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Next page" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Page 1" })).toBeOnTheScreen();
	});

	test("uncontrolled: defaultPage seeds it and an item moves it, reporting the page", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={5} defaultPage={2} onPageChange={onPageChange} />);
		await fireEvent(screen.getByRole("button", { name: "Page 4" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledTimes(1);
		expect(onPageChange).toHaveBeenCalledWith(4);
		expect(screen.getByRole("button", { name: "Page 4" })).toBeSelected();
		expect(screen.getByRole("button", { name: "Page 2" })).not.toBeSelected();
	});

	test("Next and Previous step one page", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={5} defaultPage={3} onPageChange={onPageChange} />);
		await fireEvent(screen.getByRole("button", { name: "Next page" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenLastCalledWith(4);
		await fireEvent(screen.getByRole("button", { name: "Previous page" }), "accessibilityTap");
		await fireEvent(screen.getByRole("button", { name: "Previous page" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenLastCalledWith(2);
		expect(screen.getByRole("button", { name: "Page 2" })).toBeSelected();
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onPageChange = jest.fn();
		const view = await renderWithProviders(<Pagination count={5} onPageChange={onPageChange} page={2} />);
		await fireEvent(screen.getByRole("button", { name: "Page 5" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledWith(5);
		expect(screen.getByRole("button", { name: "Page 2" })).toBeSelected();

		await view.rerender(<Pagination count={5} onPageChange={onPageChange} page={5} />);
		expect(screen.getByRole("button", { name: "Page 5" })).toBeSelected();
		expect(screen.getByRole("button", { name: "Page 2" })).not.toBeSelected();
	});

	test("re-pressing the current page is quiet", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={5} defaultPage={2} onPageChange={onPageChange} />);
		await fireEvent(screen.getByRole("button", { name: "Page 2" }), "accessibilityTap");
		expect(onPageChange).not.toHaveBeenCalled();
	});

	test("an item's own onPress fires alongside the move", async () => {
		const onPress = jest.fn();
		const onPageChange = jest.fn();
		await renderWithProviders(
			<Pagination count={3} onPageChange={onPageChange}>
				<Pagination.Item onPress={onPress} page={3} />
			</Pagination>
		);
		await fireEvent(screen.getByRole("button", { name: "Page 3" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	test("a controlled page past the count is drawn clamped and reported once", async () => {
		const onPageChange = jest.fn();
		const view = await renderWithProviders(<Pagination count={3} onPageChange={onPageChange} page={9} />);
		expect(screen.getByRole("button", { name: "Page 3" })).toBeSelected();
		expect(onPageChange).toHaveBeenCalledTimes(1);
		expect(onPageChange).toHaveBeenCalledWith(3);

		await view.rerender(<Pagination count={3} onPageChange={onPageChange} page={9} />);
		expect(onPageChange).toHaveBeenCalledTimes(1);
	});

	test("isDisabled disables every target and swallows presses", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={5} defaultPage={3} isDisabled onPageChange={onPageChange} />);
		expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Page 4" })).toBeDisabled();
		await fireEvent(screen.getByRole("button", { name: "Page 4" }), "accessibilityTap");
		await fireEvent(screen.getByRole("button", { name: "Next page" }), "accessibilityTap");
		expect(onPageChange).not.toHaveBeenCalled();
	});

	test("a long count draws gaps named for their jump, and pressing one jumps pageJump pages", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={100} defaultPage={50} onPageChange={onPageChange} pageJump={7} />);
		const forward = screen.getByRole("button", { name: "Jump forward 7 pages" });
		expect(screen.getByRole("button", { name: "Jump back 7 pages" })).toBeOnTheScreen();
		await fireEvent(forward, "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledWith(57);
		expect(screen.getByRole("button", { name: "Page 57" })).toBeSelected();
	});

	test("a jump is clamped to the last page", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={100} defaultPage={97} onPageChange={onPageChange} pageJump={10} />);
		await fireEvent(screen.getByRole("button", { name: "Jump forward 10 pages" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledWith(100);
	});

	test("simple: the arrows alone, with visible Previous and Next labels", async () => {
		await renderWithProviders(<Pagination count={8} defaultPage={2} variant="simple" />);
		expect(screen.getByRole("button", { name: "Previous page" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Next page" })).toBeOnTheScreen();
		expect(screen.getByText("Previous")).toBeOnTheScreen();
		expect(screen.getByText("Next")).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeOnTheScreen();
	});

	test("compact: one adjustable element carrying the page as its value", async () => {
		await renderWithProviders(<Pagination count={12} defaultPage={3} variant="compact" />);
		const readout = screen.getByRole("adjustable");
		expect(readout).toHaveAccessibilityValue({ max: 12, min: 1, now: 3, text: "Page 3 of 12" });
		expect(screen.getByText("3 / 12")).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Page 3" })).not.toBeOnTheScreen();
	});

	test("compact: increment and decrement move a page and report it", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(<Pagination count={12} defaultPage={3} onPageChange={onPageChange} variant="compact" />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(onPageChange).toHaveBeenLastCalledWith(4);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 4, text: "Page 4 of 12" });

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
			nativeEvent: { actionName: "decrement" },
		});
		expect(onPageChange).toHaveBeenLastCalledWith(3);
	});

	test("compact: disabled is announced, offers no actions and ignores them", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(
			<Pagination count={12} defaultPage={3} isDisabled onPageChange={onPageChange} variant="compact" />
		);
		const readout = screen.getByRole("adjustable");
		expect(readout).toBeDisabled();
		expect(readout.props.accessibilityActions).toBeUndefined();
		await fireEvent(readout, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
		expect(onPageChange).not.toHaveBeenCalled();
	});

	test("children without a run part are leading content and the default run still draws", async () => {
		await renderWithProviders(
			<Pagination count={20} defaultPage={3} variant="compact">
				<Pagination.Summary>
					<Pagination.Status pageSize={20} total={472} />
				</Pagination.Summary>
			</Pagination>
		);
		expect(screen.getByText("41–60 of 472")).toBeOnTheScreen();
		expect(screen.getByRole("adjustable")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Next page" })).toBeOnTheScreen();
	});

	test("Status follows the pagination's page", async () => {
		await renderWithProviders(
			<Pagination count={24} defaultPage={1}>
				<Pagination.Summary>
					<Pagination.Status pageSize={20} total={472} />
				</Pagination.Summary>
			</Pagination>
		);
		expect(screen.getByText("1–20 of 472")).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Next page" }), "accessibilityTap");
		expect(screen.getByText("21–40 of 472")).toBeOnTheScreen();
	});

	test("Status stands alone with a page prop", async () => {
		await renderWithProviders(<Pagination.Status page={2} pageSize={20} total={472} />);
		expect(screen.getByText("21–40 of 472")).toBeOnTheScreen();
	});

	test("children that include a run part replace the default run", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(
			<Pagination count={9} defaultPage={2} onPageChange={onPageChange}>
				<Pagination.Previous />
				<Pagination.Item page={2} />
				<Pagination.Item page={9} />
				<Pagination.Next />
			</Pagination>
		);
		expect(screen.getAllByRole("button")).toHaveLength(4);
		expect(screen.queryByRole("button", { name: "Page 1" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Page 2" })).toBeSelected();
		await fireEvent(screen.getByRole("button", { name: "Page 9" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledWith(9);
	});

	test("a hand-built Ellipsis jumps the way it points", async () => {
		const onPageChange = jest.fn();
		await renderWithProviders(
			<Pagination count={30} defaultPage={10} onPageChange={onPageChange}>
				<Pagination.Ellipsis direction={-1} />
			</Pagination>
		);
		await fireEvent(screen.getByRole("button", { name: "Jump back 5 pages" }), "accessibilityTap");
		expect(onPageChange).toHaveBeenCalledWith(5);
	});

	test("usePagination reads the enclosing page and count", async () => {
		function Probe() {
			const { count, page } = usePagination();
			return <Text>{`probe ${page}/${count}`}</Text>;
		}
		await renderWithProviders(
			<Pagination count={7} defaultPage={4}>
				<Pagination.Summary>
					<Probe />
				</Pagination.Summary>
			</Pagination>
		);
		expect(screen.getByText("probe 4/7")).toBeOnTheScreen();
	});

	test("usePagination outside a Pagination throws", async () => {
		function Probe() {
			usePagination();
			return null;
		}
		await withSilencedErrors(async () => {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"usePagination must be called inside a <Pagination>."
			);
		});
	});

	test.each([
		["Pagination.Item", <Pagination.Item key="i" page={1} />],
		["Pagination.Previous", <Pagination.Previous key="p" />],
		["Pagination.Next", <Pagination.Next key="n" />],
		["Pagination.Ellipsis", <Pagination.Ellipsis direction={1} key="e" />],
		["Pagination.Summary", <Pagination.Summary key="s" />],
	])("%s outside a Pagination throws", async (name, part) => {
		await withSilencedErrors(async () => {
			await expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <Pagination>.`);
		});
	});
});
