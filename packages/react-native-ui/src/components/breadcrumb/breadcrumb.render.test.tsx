import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Breadcrumb } from "./breadcrumb";
import { useBreadcrumb } from "./breadcrumb.context";

const TRAIL = ["Home", "Documents", "Work", "Clients", "Northwind", "Invoices", "2026"] as const;

function Trail({
	onCrumb,
	...list
}: {
	onCrumb?: (crumb: string) => void;
	maxItems?: number;
	itemsBeforeCollapse?: number;
	itemsAfterCollapse?: number;
	onEllipsisPress?: (hidden: readonly number[]) => void;
}): ReactElement {
	return (
		<Breadcrumb>
			<Breadcrumb.List {...list}>
				{TRAIL.map((crumb, index) => (
					<Breadcrumb.Item key={crumb}>
						{index === TRAIL.length - 1 ? (
							<Breadcrumb.Page>{crumb}</Breadcrumb.Page>
						) : (
							<Breadcrumb.Link onPress={() => onCrumb?.(crumb)}>{crumb}</Breadcrumb.Link>
						)}
					</Breadcrumb.Item>
				))}
			</Breadcrumb.List>
		</Breadcrumb>
	);
}

async function expectThrows(ui: ReactElement, message: string): Promise<void> {
	const original = console.error;
	console.error = () => undefined;
	try {
		await expect(renderWithProviders(ui)).rejects.toThrow(message);
	} finally {
		console.error = original;
	}
}

type Host = ReturnType<typeof screen.getByText>;

function hiddenAncestor(element: Host): Host | null {
	let node: Host | null = element;
	while (node) {
		if (node.props.accessibilityElementsHidden === true) return node;
		node = node.parent;
	}
	return null;
}

// The list is `accessibilityRole="none"` and not `accessible` (so its links stay individually
// reachable); it is found by its label, which is announced as the trail's name.
describe("Breadcrumb", () => {
	test("the list is labelled 'Breadcrumb' and the label can be overridden", async () => {
		const view = await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page>Home</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();

		await view.rerender(
			<Breadcrumb>
				<Breadcrumb.List accessibilityLabel="File path">
					<Breadcrumb.Item>
						<Breadcrumb.Page>Home</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.getByLabelText("File path")).toBeTruthy();
		expect(screen.queryByLabelText("Breadcrumb")).toBeNull();
	});

	test("earlier crumbs are links named by their text", async () => {
		await renderWithProviders(<Trail />);
		for (const crumb of TRAIL.slice(0, -1)) {
			expect(screen.getByRole("link", { name: crumb })).toBeTruthy();
		}
		expect(screen.getAllByRole("link")).toHaveLength(TRAIL.length - 1);
	});

	test("the last crumb is the current page: text, selected, 'current page', not a link", async () => {
		await renderWithProviders(<Trail />);
		const page = screen.getByText("2026");
		expect(page.props.accessibilityRole).toBe("text");
		expect(page).toBeSelected();
		expect(page.props.accessibilityValue).toEqual({ text: "current page" });
		expect(screen.queryByRole("link", { name: "2026" })).toBeNull();
		expect(screen.queryByRole("button", { name: "2026" })).toBeNull();
	});

	test("the current page keeps a caller's accessibilityValue", async () => {
		await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page accessibilityValue={{ text: "you are here" }}>Security</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.getByText("Security").props.accessibilityValue).toEqual({ text: "you are here" });
	});

	test("a link's activation calls its onPress; the page has no press to call", async () => {
		const onCrumb = jest.fn();
		await renderWithProviders(<Trail onCrumb={onCrumb} />);

		await fireEvent(screen.getByRole("link", { name: "Documents" }), "accessibilityTap");
		expect(onCrumb).toHaveBeenCalledTimes(1);
		expect(onCrumb).toHaveBeenLastCalledWith("Documents");

		await fireEvent(screen.getByRole("link", { name: "Home" }), "accessibilityTap");
		expect(onCrumb).toHaveBeenCalledTimes(2);
		expect(onCrumb).toHaveBeenLastCalledWith("Home");
	});

	test("a disabled link is announced disabled and ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link isDisabled onPress={onPress}>
							Home
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Item>
						<Breadcrumb.Page>Security</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		const link = screen.getByRole("link", { name: "Home" });
		expect(link).toBeDisabled();
		await fireEvent(link, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("a separator sits between every pair of crumbs and none trails the last", async () => {
		await renderWithProviders(
			<Breadcrumb separator="/">
				<Breadcrumb.List>
					{TRAIL.map((crumb) => (
						<Breadcrumb.Item key={crumb}>
							<Breadcrumb.Page>{crumb}</Breadcrumb.Page>
						</Breadcrumb.Item>
					))}
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.getAllByText("/", { includeHiddenElements: true })).toHaveLength(TRAIL.length - 1);
	});

	test("separators are hidden from assistive technology", async () => {
		await renderWithProviders(
			<Breadcrumb separator="/">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link onPress={() => {}}>Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Item>
						<Breadcrumb.Page>Security</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		const slash = screen.getByText("/", { includeHiddenElements: true });
		expect(slash).toBeTruthy();
		expect(screen.queryByText("/")).toBeNull();
		const hidden = screen.getAllByText("/", { includeHiddenElements: true });
		expect(hidden).toHaveLength(1);
		expect(hiddenAncestor(slash)?.props.importantForAccessibility).toBe("no-hide-descendants");
	});

	test("a separator the caller writes replaces the automatic one beside it", async () => {
		await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link onPress={() => {}}>Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator>{">>"}</Breadcrumb.Separator>
					<Breadcrumb.Item>
						<Breadcrumb.Page>Security</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.getByText(">>", { includeHiddenElements: true })).toBeTruthy();
		expect(screen.getAllByText(">>", { includeHiddenElements: true })).toHaveLength(1);
		expect(screen.queryAllByText("/", { includeHiddenElements: true })).toHaveLength(0);
	});

	test("an uncollapsed trail has no ellipsis", async () => {
		await renderWithProviders(<Trail />);
		expect(screen.queryByLabelText(/hidden level/)).toBeNull();
		for (const crumb of TRAIL) {
			expect(screen.getByText(crumb)).toBeTruthy();
		}
	});

	test("under maxItems nothing collapses", async () => {
		await renderWithProviders(<Trail maxItems={TRAIL.length} />);
		expect(screen.queryByLabelText(/hidden level/)).toBeNull();
		expect(screen.getByText("Northwind")).toBeTruthy();
	});

	test("past maxItems the middle folds into a static, announced mark", async () => {
		await renderWithProviders(<Trail maxItems={4} />);
		expect(screen.getByText("Home")).toBeTruthy();
		expect(screen.getByText("2026")).toBeTruthy();
		expect(screen.queryByText("Documents")).toBeNull();
		expect(screen.queryByText("Northwind")).toBeNull();
		expect(screen.queryByText("Invoices")).toBeNull();

		const mark = screen.getByLabelText("5 hidden levels");
		expect(mark.props.accessible).toBe(true);
		expect(screen.queryByRole("button", { name: /hidden levels/ })).toBeNull();
	});

	test("itemsBeforeCollapse and itemsAfterCollapse choose what stays", async () => {
		await renderWithProviders(<Trail itemsAfterCollapse={2} itemsBeforeCollapse={2} maxItems={4} />);
		expect(screen.getByText("Home")).toBeTruthy();
		expect(screen.getByText("Documents")).toBeTruthy();
		expect(screen.getByText("Invoices")).toBeTruthy();
		expect(screen.getByText("2026")).toBeTruthy();
		expect(screen.queryByText("Work")).toBeNull();
		expect(screen.getByLabelText("3 hidden levels")).toBeTruthy();
	});

	test("with onEllipsisPress the ellipsis is a button that reports the hidden indices", async () => {
		const onEllipsisPress = jest.fn();
		await renderWithProviders(<Trail maxItems={4} onEllipsisPress={onEllipsisPress} />);
		const button = screen.getByRole("button", { name: "Show 5 hidden levels" });
		expect(onEllipsisPress).not.toHaveBeenCalled();

		await fireEvent(button, "accessibilityTap");
		expect(onEllipsisPress).toHaveBeenCalledTimes(1);
		expect(onEllipsisPress).toHaveBeenLastCalledWith([1, 2, 3, 4, 5]);
	});

	test("a single hidden level is announced in the singular", async () => {
		await renderWithProviders(
			<Trail itemsAfterCollapse={2} itemsBeforeCollapse={4} maxItems={5} onEllipsisPress={() => {}} />
		);
		expect(screen.getByRole("button", { name: "Show 1 hidden level" })).toBeTruthy();
	});

	test("overflow scroll never collapses, even past maxItems", async () => {
		await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.List maxItems={3} overflow="scroll">
					{TRAIL.map((crumb) => (
						<Breadcrumb.Item key={crumb}>
							<Breadcrumb.Page>{crumb}</Breadcrumb.Page>
						</Breadcrumb.Item>
					))}
				</Breadcrumb.List>
			</Breadcrumb>
		);
		expect(screen.queryByLabelText(/hidden level/)).toBeNull();
		for (const crumb of TRAIL) {
			expect(screen.getByText(crumb)).toBeTruthy();
		}
		expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();
	});

	test("a hand-placed ellipsis follows hiddenCount and onPress", async () => {
		const onPress = jest.fn();
		const view = await renderWithProviders(
			<Breadcrumb>
				<Breadcrumb.Ellipsis hiddenCount={2} />
			</Breadcrumb>
		);
		expect(screen.getByLabelText("2 hidden levels")).toBeTruthy();
		expect(screen.queryByRole("button")).toBeNull();

		await view.rerender(
			<Breadcrumb>
				<Breadcrumb.Ellipsis hiddenCount={2} onPress={onPress} />
			</Breadcrumb>
		);
		await fireEvent(screen.getByRole("button", { name: "Show 2 hidden levels" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("useBreadcrumb reads the root's size and throws outside one", async () => {
		function Probe(): ReactElement {
			const { size } = useBreadcrumb();
			return <Breadcrumb.Page>{`size:${size}`}</Breadcrumb.Page>;
		}
		await renderWithProviders(
			<Breadcrumb size="sm">
				<Probe />
			</Breadcrumb>
		);
		expect(screen.getByText("size:sm")).toBeTruthy();

		await expectThrows(<Probe />, "useBreadcrumb must be called inside a <Breadcrumb>.");
	});

	test.each([
		["Breadcrumb.List", <Breadcrumb.List key="p" />],
		["Breadcrumb.Item", <Breadcrumb.Item key="p" />],
		["Breadcrumb.Link", <Breadcrumb.Link key="p">x</Breadcrumb.Link>],
		["Breadcrumb.Page", <Breadcrumb.Page key="p">x</Breadcrumb.Page>],
		["Breadcrumb.Separator", <Breadcrumb.Separator key="p" />],
		["Breadcrumb.Ellipsis", <Breadcrumb.Ellipsis key="p" />],
	])("%s outside a Breadcrumb throws its documented error", async (name, part) => {
		await expectThrows(part, `${name} must be rendered inside a <Breadcrumb>.`);
	});
});
