import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
	test("renders with no parts at all", async () => {
		await renderWithProviders(<PageHeader testID="header" />);
		expect(screen.getByTestId("header")).toBeOnTheScreen();
	});

	test("Title is announced as a heading", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Content>
					<PageHeader.Title>Aria Whitlock</PageHeader.Title>
				</PageHeader.Content>
			</PageHeader>
		);
		expect(screen.getByRole("header", { name: "Aria Whitlock" })).toBeOnTheScreen();
	});

	test("an empty Title and Description render nothing", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Content>
					<PageHeader.Title>{""}</PageHeader.Title>
					<PageHeader.Description>{""}</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader>
		);
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
	});

	test("Description and Meta text are readable", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Content>
					<PageHeader.Meta>Auckland, New Zealand</PageHeader.Meta>
					<PageHeader.Description>Product designer.</PageHeader.Description>
				</PageHeader.Content>
			</PageHeader>
		);
		expect(screen.getByText("Auckland, New Zealand")).toBeOnTheScreen();
		expect(screen.getByText("Product designer.")).toBeOnTheScreen();
	});

	test("Avatar is announced by name, and isVerified says so", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Avatar name="Aria Whitlock" />
			</PageHeader>
		);
		expect(screen.getByLabelText("Aria Whitlock")).toBeOnTheScreen();
		expect(screen.queryByLabelText(/verified/)).not.toBeOnTheScreen();

		await screen.rerender(
			<PageHeader>
				<PageHeader.Avatar isVerified name="Aria Whitlock" />
			</PageHeader>
		);
		expect(screen.getByLabelText(/Aria Whitlock.*verified/)).toBeOnTheScreen();
	});

	test("an Avatar accessibilityLabel wins over the verified label", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Avatar accessibilityLabel="Profile photo" isVerified name="Aria Whitlock" />
			</PageHeader>
		);
		expect(screen.getByLabelText("Profile photo")).toBeOnTheScreen();
		expect(screen.queryByLabelText(/verified/)).not.toBeOnTheScreen();
	});

	test("a described Cover is an image; a decorative one is hidden", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Cover accessibilityLabel="Harbour at dusk" colors={["#000000", "#ffffff"]} />
			</PageHeader>
		);
		expect(screen.getByRole("image", { name: "Harbour at dusk" })).toBeOnTheScreen();

		await screen.rerender(
			<PageHeader>
				<PageHeader.Cover colors={["#000000", "#ffffff"]} />
			</PageHeader>
		);
		expect(screen.queryByRole("image")).not.toBeOnTheScreen();
	});

	test("a Cover overlay stays reachable", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Cover colors={["#000000", "#ffffff"]}>
					<Button accessibilityLabel="Back" onPress={onPress} />
				</PageHeader.Cover>
			</PageHeader>
		);
		await fireEvent(screen.getByRole("button", { name: "Back" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a Stat is one element announcing the full value then the label", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Stats>
					<PageHeader.Stat label="Followers" value={1234} />
					<PageHeader.Stat label="Posts" value="87" />
				</PageHeader.Stats>
			</PageHeader>
		);
		expect(screen.getByLabelText(`${new Intl.NumberFormat().format(1234)} Followers`)).toBeOnTheScreen();
		expect(screen.getByText("1.2K")).toBeOnTheScreen();
		expect(screen.getByLabelText("87 Posts")).toBeOnTheScreen();
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("a Stat with onPress is a button that fires it", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Stats>
					<PageHeader.Stat label="Followers" onPress={onPress} value={50} />
					<PageHeader.Stat label="Posts" value={3} />
				</PageHeader.Stats>
			</PageHeader>
		);
		expect(screen.getAllByRole("button")).toHaveLength(1);
		await fireEvent(screen.getByRole("button", { name: "50 Followers" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("inline layout and dividers keep every stat reachable", async () => {
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Stats isDivided layout="inline">
					<PageHeader.Stat label="Followers" value={10} />
					<PageHeader.Stat label="Posts" value={20} />
					<PageHeader.Stat label="Following" value={30} />
				</PageHeader.Stats>
			</PageHeader>
		);
		expect(screen.getByLabelText("10 Followers")).toBeOnTheScreen();
		expect(screen.getByLabelText("20 Posts")).toBeOnTheScreen();
		expect(screen.getByLabelText("30 Following")).toBeOnTheScreen();
	});

	test("Actions render the caller's buttons and fire their callbacks", async () => {
		const onFollow = jest.fn();
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Actions>
					<Button onPress={onFollow}>Follow</Button>
					<Button accessibilityLabel="Message" />
				</PageHeader.Actions>
			</PageHeader>
		);
		expect(screen.getAllByRole("button")).toHaveLength(2);
		await fireEvent(screen.getByRole("button", { name: "Follow" }), "accessibilityTap");
		expect(onFollow).toHaveBeenCalledTimes(1);
	});

	test("a disabled action does not fire", async () => {
		const onFollow = jest.fn();
		await renderWithProviders(
			<PageHeader>
				<PageHeader.Actions>
					<Button isDisabled onPress={onFollow}>
						Follow
					</Button>
				</PageHeader.Actions>
			</PageHeader>
		);
		const button = screen.getByRole("button", { name: "Follow" });
		expect(button).toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		expect(onFollow).not.toHaveBeenCalled();
	});

	test("card variant renders the same parts with the same semantics", async () => {
		await renderWithProviders(
			<PageHeader align="start" variant="card">
				<PageHeader.Avatar isVerified name="Aria Whitlock" />
				<PageHeader.Content>
					<PageHeader.Title>Aria Whitlock</PageHeader.Title>
				</PageHeader.Content>
				<PageHeader.Stats>
					<PageHeader.Stat label="Posts" value={87} />
				</PageHeader.Stats>
			</PageHeader>
		);
		expect(screen.getByRole("header", { name: "Aria Whitlock" })).toBeOnTheScreen();
		expect(screen.getByLabelText(/verified/)).toBeOnTheScreen();
		expect(screen.getByLabelText("87 Posts")).toBeOnTheScreen();
	});

	describe("a part outside its root", () => {
		beforeEach(() => {
			jest.spyOn(console, "error").mockImplementation(() => {});
		});
		afterEach(() => {
			jest.restoreAllMocks();
		});

		test.each([
			["PageHeader.Title", <PageHeader.Title key="t">Name</PageHeader.Title>],
			["PageHeader.Description", <PageHeader.Description key="d">Bio</PageHeader.Description>],
			["PageHeader.Meta", <PageHeader.Meta key="m">Here</PageHeader.Meta>],
			["PageHeader.Avatar", <PageHeader.Avatar key="a" name="Aria" />],
			["PageHeader.Stats", <PageHeader.Stats key="s" />],
			["PageHeader.Stat", <PageHeader.Stat key="st" label="Posts" value={1} />],
		])("%s throws", async (name, element) => {
			await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <PageHeader>.`);
		});
	});
});
