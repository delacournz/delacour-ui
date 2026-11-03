import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { View } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { ImageViewer, type ImageViewerProps } from "./image-viewer";
import { useImageViewer } from "./image-viewer.context";

/*
 * Not reachable under Jest: pinch, pan, double-tap, single-tap and the dismiss drag (the layer's
 * gestures carry no `.withTestId`), the flight from the Trigger's frame (refs are null, so the
 * viewer opens with the origin this suite's stub reports), and focus hand-off. Zoom is covered only to the extent
 * the accessibility actions are announced.
 */

const PHOTOS = [
	{ alt: "A sheltered bay", caption: "Low tide", id: "bay", source: { uri: "https://example.test/bay.jpg" } },
	{ alt: "A mountain pass", id: "pass", source: { uri: "https://example.test/pass.jpg" } },
	{ alt: "A waterfall in bush", id: "falls", source: { uri: "https://example.test/falls.jpg" } },
] as const;

function Gallery(props: ImageViewerProps): ReactElement {
	return (
		<ImageViewer {...props}>
			{PHOTOS.map((photo) => (
				<ImageViewer.Trigger key={photo.id} {...photo} />
			))}
			{props.children}
		</ImageViewer>
	);
}

function Controls(): ReactElement {
	const { count, index, isOpen, open } = useImageViewer();
	return (
		<>
			<Button accessibilityLabel={`state ${isOpen ? "open" : "closed"} ${index}/${count}`} />
			<Button accessibilityLabel="open last" onPress={() => open(2)} />
		</>
	);
}

type MeasureInWindow = (callback: (x: number, y: number, width: number, height: number) => void) => void;

const pager = () => screen.findByRole("adjustable");

describe("ImageViewer", () => {
	let errorSpy: ReturnType<typeof jest.spyOn> | undefined;
	let measureSpy: ReturnType<typeof jest.spyOn> | undefined;

	beforeEach(() => {
		errorSpy = undefined;
		const proto = View.prototype as unknown as { measureInWindow: MeasureInWindow };
		measureSpy = jest.spyOn(proto, "measureInWindow").mockImplementation((callback) => callback(10, 20, 100, 100));
	});

	afterEach(() => {
		errorSpy?.mockRestore();
		measureSpy?.mockRestore();
	});

	test("Triggers render as labelled image buttons with a hint, and nothing is open", async () => {
		await renderWithProviders(<Gallery />);
		const trigger = screen.getByRole("imagebutton", { name: "A sheltered bay" });
		expect(trigger).toBeOnTheScreen();
		expect(trigger.props.accessibilityHint).toBe("Opens full screen image viewer");
		expect(screen.getAllByRole("imagebutton")).toHaveLength(3);
		expect(screen.queryByRole("adjustable")).not.toBeOnTheScreen();
	});

	test("pressing a Trigger opens the viewer at its image, announcing 'N of M'", async () => {
		const onOpenChange = jest.fn();
		const onIndexChange = jest.fn();
		await renderWithProviders(<Gallery onIndexChange={onIndexChange} onOpenChange={onOpenChange} />);

		await fireEvent(screen.getByRole("imagebutton", { name: "A mountain pass" }), "accessibilityTap");

		const viewer = await pager();
		expect(viewer).toHaveAccessibilityValue({ text: "2 of 3" });
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		expect(screen.getByTestId("image-viewer-counter")).toHaveTextContent("2 / 3");
	});

	test("the pager is labelled with the alt and the caption", async () => {
		await renderWithProviders(<Gallery defaultIndex={0} />);
		await fireEvent(screen.getByRole("imagebutton", { name: "A sheltered bay" }), "accessibilityTap");
		expect(await screen.findByLabelText("A sheltered bay. Low tide")).toBeOnTheScreen();
		expect(screen.getByText("Low tide")).toBeOnTheScreen();
	});

	test("the pager offers paging and zoom as accessibility actions", async () => {
		await renderWithProviders(<Gallery defaultOpen />);
		const viewer = await pager();
		expect(viewer.props.accessibilityActions).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ label: "Next image", name: "increment" }),
				expect.objectContaining({ label: "Previous image", name: "decrement" }),
				expect.objectContaining({ label: "Zoom in", name: "zoomIn" }),
				expect.objectContaining({ label: "Zoom out", name: "zoomOut" }),
				expect.objectContaining({ label: "Reset zoom", name: "resetZoom" }),
			])
		);
	});

	test("uncontrolled: increment and decrement page and report once per change", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<Gallery defaultIndex={1} defaultOpen onIndexChange={onIndexChange} />);
		const viewer = await pager();
		expect(viewer).toHaveAccessibilityValue({ text: "2 of 3" });

		await fireEvent(viewer, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
		expect(await pager()).toHaveAccessibilityValue({ text: "3 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(2);

		await fireEvent(await pager(), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
		expect(onIndexChange).toHaveBeenCalledTimes(1);

		await fireEvent(await pager(), "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
		expect(await pager()).toHaveAccessibilityValue({ text: "2 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
	});

	test("controlled index: paging reports and waits for the prop", async () => {
		const onIndexChange = jest.fn();
		const view = await renderWithProviders(<Gallery defaultOpen index={0} onIndexChange={onIndexChange} />);
		await fireEvent(await pager(), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
		expect(onIndexChange).toHaveBeenCalledWith(1);
		expect(await pager()).toHaveAccessibilityValue({ text: "1 of 3" });

		await view.rerender(<Gallery defaultOpen index={1} onIndexChange={onIndexChange} />);
		expect(await pager()).toHaveAccessibilityValue({ text: "2 of 3" });
	});

	test("an out-of-range index is clamped into the gallery", async () => {
		await renderWithProviders(<Gallery defaultIndex={9} defaultOpen />);
		expect(await pager()).toHaveAccessibilityValue({ text: "3 of 3" });
	});

	test("the chrome's close button closes it, reporting false", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Gallery defaultOpen onOpenChange={onOpenChange} />);
		await pager();
		await fireEvent(screen.getByRole("button", { name: "Close image viewer" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("showsChrome={false} leaves no close button or counter", async () => {
		await renderWithProviders(<Gallery defaultOpen showsChrome={false} />);
		await pager();
		expect(screen.queryByRole("button", { name: "Close image viewer" })).not.toBeOnTheScreen();
		expect(screen.queryByTestId("image-viewer-counter")).not.toBeOnTheScreen();
	});

	test("a single image shows no counter", async () => {
		await renderWithProviders(
			<ImageViewer defaultOpen>
				<ImageViewer.Trigger {...PHOTOS[0]} />
			</ImageViewer>
		);
		await pager();
		expect(screen.queryByTestId("image-viewer-counter")).not.toBeOnTheScreen();
	});

	test("controlled open: the Trigger only asks, the prop decides", async () => {
		const onOpenChange = jest.fn();
		const view = await renderWithProviders(<Gallery onOpenChange={onOpenChange} open={false} />);
		await fireEvent(screen.getByRole("imagebutton", { name: "A sheltered bay" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("adjustable")).not.toBeOnTheScreen();

		await view.rerender(<Gallery onOpenChange={onOpenChange} open />);
		expect(await pager()).toBeOnTheScreen();
	});

	test("isDisabled announces Triggers disabled and keeps the viewer shut", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Gallery isDisabled onOpenChange={onOpenChange} />);
		const trigger = screen.getByRole("imagebutton", { name: "A sheltered bay" });
		expect(trigger).toBeDisabled();
		await fireEvent(trigger, "accessibilityTap");
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.queryByRole("adjustable")).not.toBeOnTheScreen();
	});

	test("data mode: Triggers name an index into images", async () => {
		const images = PHOTOS.map(({ alt, id, source }) => ({ alt, id, source }));
		await renderWithProviders(
			<ImageViewer images={images}>
				<ImageViewer.Trigger index={0} />
				<ImageViewer.Trigger index={2} />
			</ImageViewer>
		);
		expect(screen.getAllByRole("imagebutton")).toHaveLength(2);
		await fireEvent(screen.getByRole("imagebutton", { name: "A waterfall in bush" }), "accessibilityTap");
		expect(await pager()).toHaveAccessibilityValue({ text: "3 of 3" });
	});

	test("renderImage draws every image", async () => {
		const renderImage = jest.fn<NonNullable<ImageViewerProps["renderImage"]>>(() => <View />);
		await renderWithProviders(<Gallery renderImage={renderImage} />);
		expect(renderImage).toHaveBeenCalled();
		expect(renderImage.mock.calls.map(([props]) => props.alt)).toEqual(
			expect.arrayContaining(PHOTOS.map((photo) => photo.alt))
		);
	});

	test("useImageViewer reflects state and open(index) drives it", async () => {
		await renderWithProviders(
			<Gallery>
				<Controls />
			</Gallery>
		);
		expect(screen.getByRole("button", { name: "state closed 0/3" })).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "open last" }), "accessibilityTap");
		expect(await pager()).toHaveAccessibilityValue({ text: "3 of 3" });
		expect(screen.getByRole("button", { name: "state open 2/3" })).toBeOnTheScreen();
	});

	test("ImageViewer.Trigger outside a viewer throws its documented error", async () => {
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(renderWithProviders(<ImageViewer.Trigger {...PHOTOS[0]} />)).rejects.toThrow(
			"ImageViewer.Trigger must be rendered inside an <ImageViewer>."
		);
	});

	test("ImageViewer.Close outside a viewer throws its documented error", async () => {
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(renderWithProviders(<ImageViewer.Close />)).rejects.toThrow(
			"ImageViewer.Close must be rendered inside an <ImageViewer>."
		);
	});

	test("useImageViewer outside a viewer throws", async () => {
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		function Probe(): ReactElement {
			useImageViewer();
			return <View />;
		}
		await expect(renderWithProviders(<Probe />)).rejects.toThrow(
			"useImageViewer must be called inside an <ImageViewer>."
		);
	});
});
