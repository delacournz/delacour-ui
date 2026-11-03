import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Table } from "./table";
import { useTable } from "./table.context";

const COLUMNS = [{ flex: 1 }, { width: 64, align: "end" as const }];

type Sort = { direction?: "asc" | "desc"; onPress: () => void };

function Sample({
	nameSort,
	qtySort,
	rows = [
		["Apples", 3],
		["Pears", 5],
	],
	caption,
}: {
	nameSort?: Sort;
	qtySort?: Sort;
	rows?: readonly (readonly [string, number])[];
	caption?: string;
}) {
	return (
		<Table columns={COLUMNS}>
			<Table.Header>
				<Table.Row>
					<Table.Head sort={nameSort}>Item</Table.Head>
					<Table.Head sort={qtySort}>Qty</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{rows.map(([name, qty]) => (
					<Table.Row key={name}>
						<Table.Cell>{name}</Table.Cell>
						<Table.Cell>{qty}</Table.Cell>
					</Table.Row>
				))}
				<Table.Empty>No items</Table.Empty>
			</Table.Body>
			{caption ? <Table.Caption>{caption}</Table.Caption> : null}
		</Table>
	);
}

describe("Table", () => {
	test("cells are named by their column header and value", async () => {
		await renderWithProviders(<Sample />);
		expect(screen.getByLabelText("Item, Apples")).toBeOnTheScreen();
		expect(screen.getByLabelText("Qty, 3")).toBeOnTheScreen();
		expect(screen.getByLabelText("Item, Pears")).toBeOnTheScreen();
		expect(screen.getByLabelText("Qty, 5")).toBeOnTheScreen();
	});

	test("a cell's own accessibilityLabel overrides the column-prefixed name", async () => {
		await renderWithProviders(
			<Table columns={COLUMNS}>
				<Table.Header>
					<Table.Row>
						<Table.Head>Item</Table.Head>
						<Table.Head>Qty</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<Table.Row>
						<Table.Cell>Apples</Table.Cell>
						<Table.Cell accessibilityLabel="Three apples">3</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table>
		);
		expect(screen.getByLabelText("Three apples")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Qty, 3")).toBeNull();
	});

	test("a cell with no header text is named by its value alone", async () => {
		await renderWithProviders(
			<Table>
				<Table.Body>
					<Table.Row>
						<Table.Cell>Solo</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table>
		);
		expect(screen.getByLabelText("Solo")).toBeOnTheScreen();
	});

	test("the header text and caption render", async () => {
		await renderWithProviders(<Sample caption="Prices include GST" />);
		expect(screen.getByText("Item")).toBeOnTheScreen();
		expect(screen.getByText("Qty")).toBeOnTheScreen();
		expect(screen.getByText("Prices include GST")).toBeOnTheScreen();
	});

	test("a plain head is not a button", async () => {
		await renderWithProviders(<Sample />);
		expect(screen.queryByRole("button")).toBeNull();
	});

	describe("sorting", () => {
		test("a sortable head is a button whose value announces the sort state", async () => {
			await renderWithProviders(
				<Sample nameSort={{ onPress: jest.fn() }} qtySort={{ direction: "desc", onPress: jest.fn() }} />
			);
			const item = screen.getByRole("button", { name: "Item" });
			const qty = screen.getByRole("button", { name: "Qty" });
			expect(item).toHaveAccessibilityValue({ text: "not sorted" });
			expect(qty).toHaveAccessibilityValue({ text: "sorted descending" });
		});

		test("ascending is announced as sorted ascending", async () => {
			await renderWithProviders(<Sample nameSort={{ direction: "asc", onPress: jest.fn() }} />);
			expect(screen.getByRole("button", { name: "Item" })).toHaveAccessibilityValue({ text: "sorted ascending" });
		});

		test("activating a sortable head calls its onPress", async () => {
			const onNamePress = jest.fn();
			const onQtyPress = jest.fn();
			await renderWithProviders(<Sample nameSort={{ onPress: onNamePress }} qtySort={{ onPress: onQtyPress }} />);
			await fireEvent(screen.getByRole("button", { name: "Qty" }), "accessibilityTap");
			expect(onQtyPress).toHaveBeenCalledTimes(1);
			expect(onNamePress).not.toHaveBeenCalled();
		});

		test("the caller owns the order: the announced state follows the prop", async () => {
			const onPress = jest.fn();
			const view = await renderWithProviders(<Sample qtySort={{ onPress }} />);
			await fireEvent(screen.getByRole("button", { name: "Qty" }), "accessibilityTap");
			expect(screen.getByRole("button", { name: "Qty" })).toHaveAccessibilityValue({ text: "not sorted" });

			await view.rerender(<Sample qtySort={{ direction: "asc", onPress }} />);
			expect(screen.getByRole("button", { name: "Qty" })).toHaveAccessibilityValue({ text: "sorted ascending" });
		});
	});

	describe("pressable rows", () => {
		function Rows({
			onPress,
			selected,
			disabled,
		}: {
			onPress: (id: string) => void;
			selected?: string;
			disabled?: string;
		}) {
			return (
				<Table columns={COLUMNS}>
					<Table.Header>
						<Table.Row>
							<Table.Head>Item</Table.Head>
							<Table.Head>Qty</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{["Apples", "Pears"].map((name, i) => (
							<Table.Row
								isDisabled={name === disabled}
								isSelected={name === selected}
								key={name}
								onPress={() => onPress(name)}
							>
								<Table.Cell>{name}</Table.Cell>
								<Table.Cell>{i + 3}</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table>
			);
		}

		test("a pressable row is one button named by all of its cells", async () => {
			await renderWithProviders(<Rows onPress={jest.fn()} />);
			expect(screen.getByRole("button", { name: "Item, Apples, Qty, 3" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Item, Pears, Qty, 4" })).toBeOnTheScreen();
		});

		test("activating a row calls onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(<Rows onPress={onPress} />);
			await fireEvent(screen.getByRole("button", { name: /Pears/ }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
			expect(onPress).toHaveBeenCalledWith("Pears");
		});

		test("isSelected is announced as selected", async () => {
			await renderWithProviders(<Rows onPress={jest.fn()} selected="Pears" />);
			expect(screen.getByRole("button", { name: /Pears/ })).toBeSelected();
			expect(screen.getByRole("button", { name: /Apples/ })).not.toBeSelected();
		});

		test("isDisabled is announced and blocks the press", async () => {
			const onPress = jest.fn();
			await renderWithProviders(<Rows disabled="Apples" onPress={onPress} />);
			const row = screen.getByRole("button", { name: /Apples/ });
			expect(row).toBeDisabled();
			await fireEvent(row, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
			expect(screen.getByRole("button", { name: /Pears/ })).toBeEnabled();
		});

		test("an explicit accessibilityLabel names the row", async () => {
			await renderWithProviders(
				<Table>
					<Table.Body>
						<Table.Row accessibilityLabel="Open order" onPress={jest.fn()}>
							<Table.Cell>#1</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>
			);
			expect(screen.getByRole("button", { name: "Open order" })).toBeOnTheScreen();
		});

		test("a row without onPress is not a button", async () => {
			await renderWithProviders(<Sample />);
			expect(screen.queryByRole("button")).toBeNull();
		});

		test("onLongPress alone also makes the row a button", async () => {
			await renderWithProviders(
				<Table>
					<Table.Body>
						<Table.Row onLongPress={jest.fn()}>
							<Table.Cell>#1</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>
			);
			expect(screen.getByRole("button", { name: "#1" })).toBeOnTheScreen();
		});
	});

	describe("empty state", () => {
		test("Table.Empty shows when the body has no rows, and the header stays", async () => {
			await renderWithProviders(<Sample rows={[]} />);
			expect(screen.getByText("No items")).toBeOnTheScreen();
			expect(screen.getByText("Item")).toBeOnTheScreen();
		});

		test("Table.Empty is hidden when there are rows", async () => {
			await renderWithProviders(<Sample />);
			expect(screen.queryByText("No items")).toBeNull();
		});

		test("Table.Empty appears when the rows go away", async () => {
			const view = await renderWithProviders(<Sample />);
			await view.rerender(<Sample rows={[]} />);
			expect(screen.getByText("No items")).toBeOnTheScreen();
			expect(screen.queryByLabelText("Item, Apples")).toBeNull();
		});
	});

	describe("outside a Table", () => {
		const outside: readonly [string, () => React.ReactElement, string][] = [
			["Table.Row", () => <Table.Row />, "Table.Row must be rendered inside a <Table>."],
			["Table.Cell", () => <Table.Cell>x</Table.Cell>, "Table.Cell must be rendered inside a <Table>."],
			["Table.Head", () => <Table.Head>x</Table.Head>, "Table.Head must be rendered inside a <Table>."],
			["Table.Body", () => <Table.Body />, "Table.Body must be rendered inside a <Table>."],
			["Table.Empty", () => <Table.Empty>x</Table.Empty>, "Table.Empty must be rendered inside a <Table>."],
			["Table.Caption", () => <Table.Caption>x</Table.Caption>, "Table.Caption must be rendered inside a <Table>."],
		];

		test.each(outside)("%s throws", async (_name, element, message) => {
			const original = console.error;
			console.error = () => {};
			try {
				await expect(renderWithProviders(element())).rejects.toThrow(message);
			} finally {
				console.error = original;
			}
		});

		test("useTable throws outside a Table and reads the columns inside one", async () => {
			function Probe() {
				const { columns } = useTable();
				return <Table.Cell>{`${columns?.length ?? 0} columns`}</Table.Cell>;
			}
			const original = console.error;
			console.error = () => {};
			try {
				await expect(renderWithProviders(<Probe />)).rejects.toThrow("useTable must be called inside a <Table>.");
			} finally {
				console.error = original;
			}
			await renderWithProviders(
				<Table columns={COLUMNS}>
					<Probe />
				</Table>
			);
			expect(screen.getByText("2 columns")).toBeOnTheScreen();
		});
	});
});
