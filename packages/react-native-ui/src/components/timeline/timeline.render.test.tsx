import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { renderWithProviders, screen } from "../../test/render";
import { Timeline } from "./timeline";
import { useTimeline, useTimelineItem } from "./timeline.context";

type EventData = { id: string; title: string };

const EVENTS: readonly EventData[] = [
	{ id: "a", title: "Placed" },
	{ id: "b", title: "Packed" },
	{ id: "c", title: "Shipped" },
];

/**
 * Three labelled events, returned as an array rather than a component: the root
 * counts its direct `Timeline.Item` children, and a wrapper would hide them.
 */
function events(tones: readonly ("default" | "success" | "destructive")[] = []): ReactElement[] {
	return EVENTS.map((event, index) => (
		<Timeline.Item accessibilityLabel={event.title} key={event.id} step={index} tone={tones[index] ?? "default"}>
			<Timeline.Title>{event.title}</Timeline.Title>
			<Timeline.Description>{`${event.title} description`}</Timeline.Description>
		</Timeline.Item>
	));
}

/** Renders `ui` expecting a throw, with React's error logging silenced and restored. */
async function expectThrow(ui: ReactElement, message: string): Promise<void> {
	const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
	const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
	try {
		await expect(renderWithProviders(ui)).rejects.toThrow(message);
	} finally {
		error.mockRestore();
		warn.mockRestore();
	}
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Timeline", () => {
	test("each event is one accessible element that merges its text and reads position and status", async () => {
		await renderWithProviders(<Timeline value={1}>{events()}</Timeline>);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, completed" });
		expect(screen.getByLabelText("Packed")).toHaveAccessibilityValue({ text: "Event 2 of 3, current" });
		expect(screen.getByLabelText("Shipped")).toHaveAccessibilityValue({ text: "Event 3 of 3, upcoming" });
		expect(screen.getByText("Packed description")).toBeOnTheScreen();
	});

	test("the default value leaves every event upcoming", async () => {
		await renderWithProviders(<Timeline>{events()}</Timeline>);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, upcoming" });
		expect(screen.getByLabelText("Shipped")).toHaveAccessibilityValue({ text: "Event 3 of 3, upcoming" });
	});

	test("changing value moves the current event", async () => {
		const view = await renderWithProviders(<Timeline value={0}>{events()}</Timeline>);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, current" });
		await view.rerender(<Timeline value={2}>{events()}</Timeline>);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, completed" });
		expect(screen.getByLabelText("Shipped")).toHaveAccessibilityValue({ text: "Event 3 of 3, current" });
	});

	test("isCompleted overrides an upcoming event but never demotes the current one", async () => {
		await renderWithProviders(
			<Timeline value={1}>
				<Timeline.Item accessibilityLabel="Early" isCompleted step={0}>
					<Timeline.Title>Early</Timeline.Title>
				</Timeline.Item>
				<Timeline.Item accessibilityLabel="Now" isCompleted={false} step={1}>
					<Timeline.Title>Now</Timeline.Title>
				</Timeline.Item>
				<Timeline.Item accessibilityLabel="Later" isCompleted step={2}>
					<Timeline.Title>Later</Timeline.Title>
				</Timeline.Item>
			</Timeline>
		);
		expect(screen.getByLabelText("Now")).toHaveAccessibilityValue({ text: "Event 2 of 3, current" });
		expect(screen.getByLabelText("Later")).toHaveAccessibilityValue({ text: "Event 3 of 3, completed" });
	});

	test("a tone is announced; the destructive tone reads as error and the default is silent", async () => {
		await renderWithProviders(<Timeline value={2}>{events(["success", "destructive", "default"])}</Timeline>);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, completed, success" });
		expect(screen.getByLabelText("Packed")).toHaveAccessibilityValue({ text: "Event 2 of 3, completed, error" });
		expect(screen.getByLabelText("Shipped")).toHaveAccessibilityValue({ text: "Event 3 of 3, current" });
	});

	test("the marker is hidden from assistive technology; the numbered variant shows the position", async () => {
		await renderWithProviders(
			<Timeline value={0} variant="numbered">
				{events()}
			</Timeline>
		);
		expect(screen.queryByText("2")).not.toBeOnTheScreen();
		expect(screen.getByText("2", { hidden: true })).toBeOnTheScreen();
		expect(screen.getByText("3", { hidden: true })).toBeOnTheScreen();
	});

	test("a Timeline.Indicator written among the children is lifted into the marker", async () => {
		await renderWithProviders(
			<Timeline value={0} variant="icon">
				<Timeline.Item accessibilityLabel="Custom" step={0}>
					<Timeline.Indicator testID="marker" />
					<Timeline.Title>Custom</Timeline.Title>
				</Timeline.Item>
			</Timeline>
		);
		expect(screen.getByTestId("marker", { hidden: true })).toBeOnTheScreen();
		expect(screen.getByText("Custom")).toBeOnTheScreen();
	});

	test("an event counted alone claims its position without a total when the root could not count", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		function Wrapped(): ReactElement {
			return <>{events()}</>;
		}
		await renderWithProviders(
			<Timeline value={0}>
				<Wrapped />
			</Timeline>
		);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1, current" });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("found no <Timeline.Item>"));
	});

	test("a Timeline.Item with no step warns", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(
			<Timeline value={0}>
				<Timeline.Item>
					<Timeline.Title>Lost</Timeline.Title>
				</Timeline.Item>
			</Timeline>
		);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("Timeline.Item: no step"));
	});

	test("the masthead is a header", async () => {
		await renderWithProviders(
			<Timeline value={0}>
				<Timeline.Masthead label="Order" title="Order 4021" />
				{events()}
			</Timeline>
		);
		expect(screen.getByRole("header")).toBeOnTheScreen();
		expect(screen.getByText("Order 4021")).toBeOnTheScreen();
		expect(screen.getByText("Order")).toBeOnTheScreen();
	});

	test("aside, trailing, meta, date and stats render inside an item", async () => {
		await renderWithProviders(
			<Timeline value={0}>
				<Timeline.Item accessibilityLabel="Rich" step={0}>
					<Timeline.Aside>
						<Timeline.Date>9:41</Timeline.Date>
					</Timeline.Aside>
					<Timeline.Trailing>
						<Timeline.Meta>Auckland</Timeline.Meta>
					</Timeline.Trailing>
					<Timeline.Title>Rich</Timeline.Title>
					<Timeline.Stats>
						<Timeline.Stat label="Distance" value="12 km" />
					</Timeline.Stats>
				</Timeline.Item>
			</Timeline>
		);
		expect(screen.getByText("9:41")).toBeOnTheScreen();
		expect(screen.getByText("Auckland")).toBeOnTheScreen();
		expect(screen.getByText("Distance")).toBeOnTheScreen();
		expect(screen.getByText("12 km")).toBeOnTheScreen();
	});

	test("a custom part reads the root and item through useTimeline and useTimelineItem", async () => {
		function Probe(): ReactElement {
			const root = useTimeline();
			const item = useTimelineItem();
			return <Timeline.Title>{`${root.orientation}/${root.count}/${item.step}/${item.status}`}</Timeline.Title>;
		}
		await renderWithProviders(
			<Timeline value={0}>
				<Timeline.Item step={0}>
					<Probe />
				</Timeline.Item>
			</Timeline>
		);
		expect(screen.getByText("vertical/1/0/current")).toBeOnTheScreen();
	});

	test("an item used outside a timeline throws its documented error", async () => {
		await expectThrow(
			<Timeline.Item step={0}>
				<Timeline.Title>Orphan</Timeline.Title>
			</Timeline.Item>,
			"Timeline.Item must be rendered inside a <Timeline> or <Timeline.List>."
		);
	});

	test("the masthead used outside a timeline throws", async () => {
		await expectThrow(
			<Timeline.Masthead title="Orphan" />,
			"Timeline.Masthead must be rendered inside a <Timeline> or <Timeline.List>."
		);
	});

	test.each([
		["Timeline.Title", <Timeline.Title key="p">x</Timeline.Title>],
		["Timeline.Description", <Timeline.Description key="p">x</Timeline.Description>],
		["Timeline.Date", <Timeline.Date key="p">x</Timeline.Date>],
		["Timeline.Meta", <Timeline.Meta key="p">x</Timeline.Meta>],
		["Timeline.Indicator", <Timeline.Indicator key="p" />],
		["Timeline.Stat", <Timeline.Stat key="p" label="a" value="b" />],
	])("%s outside a Timeline.Item throws inside a timeline", async (name, part) => {
		await expectThrow(<Timeline value={0}>{part}</Timeline>, `${name} must be rendered inside a <Timeline.Item>.`);
	});

	test("the hooks throw outside their roots", async () => {
		function UsesRoot(): null {
			useTimeline();
			return null;
		}
		function UsesItem(): null {
			useTimelineItem();
			return null;
		}
		await expectThrow(<UsesRoot />, "useTimeline must be called inside a <Timeline> or <Timeline.List>.");
		await expectThrow(
			<Timeline value={0}>
				<UsesItem />
			</Timeline>,
			"useTimelineItem must be called inside a <Timeline.Item>."
		);
	});
});

describe("Timeline horizontal", () => {
	test("each column is one accessible element with the same position and status", async () => {
		await renderWithProviders(
			<Timeline orientation="horizontal" value={1}>
				{events()}
			</Timeline>
		);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, completed" });
		expect(screen.getByLabelText("Packed")).toHaveAccessibilityValue({ text: "Event 2 of 3, current" });
		expect(screen.getByText("Shipped")).toBeOnTheScreen();
	});

	test("a column with no content is a tick, hidden from assistive technology", async () => {
		await renderWithProviders(
			<Timeline orientation="horizontal" value={0}>
				{events()}
				<Timeline.Item step={3} testID="gap" />
			</Timeline>
		);
		expect(screen.queryByTestId("gap")).not.toBeOnTheScreen();
		const gap = screen.getByTestId("gap", { hidden: true });
		expect(gap).toHaveProp("accessible", false);
		expect(gap).toHaveProp("accessibilityElementsHidden", true);
	});

	test("the masthead renders above the strip as a header", async () => {
		await renderWithProviders(
			<Timeline orientation="horizontal" value={0}>
				<Timeline.Masthead title="Season" />
				{events()}
			</Timeline>
		);
		expect(screen.getByRole("header")).toBeOnTheScreen();
		expect(screen.getByText("Season")).toBeOnTheScreen();
	});
});

describe("Timeline.List", () => {
	test("supplies each item's step and count from the data, so renderItem needs neither", async () => {
		await renderWithProviders(
			<Timeline.List
				data={EVENTS}
				keyExtractor={(event) => event.id}
				renderItem={({ item }) => (
					<Timeline.Item accessibilityLabel={item.title}>
						<Timeline.Title>{item.title}</Timeline.Title>
					</Timeline.Item>
				)}
				value={1}
			/>
		);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, completed" });
		expect(screen.getByLabelText("Packed")).toHaveAccessibilityValue({ text: "Event 2 of 3, current" });
		expect(screen.getByLabelText("Shipped")).toHaveAccessibilityValue({ text: "Event 3 of 3, upcoming" });
	});

	test("horizontal lists render their columns and an empty list renders none", async () => {
		const view = await renderWithProviders(
			<Timeline.List
				data={EVENTS}
				itemWidth={120}
				keyExtractor={(event) => event.id}
				orientation="horizontal"
				renderItem={({ item }) => (
					<Timeline.Item accessibilityLabel={item.title}>
						<Timeline.Title>{item.title}</Timeline.Title>
					</Timeline.Item>
				)}
				value={0}
			/>
		);
		expect(screen.getByLabelText("Placed")).toHaveAccessibilityValue({ text: "Event 1 of 3, current" });
		await view.rerender(
			<Timeline.List data={[]} orientation="horizontal" renderItem={() => <Timeline.Item />} value={0} />
		);
		expect(screen.queryByLabelText("Placed")).not.toBeOnTheScreen();
	});
});
