import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Attachment } from "./attachment";
import { useAttachment } from "./attachment.context";

function activate(element: Parameters<typeof fireEvent>[0], actionName: string) {
	return fireEvent(element, "accessibilityAction", { nativeEvent: { actionName } });
}

async function renderWithoutRoot(ui: React.ReactElement) {
	const original = console.error;
	console.error = () => undefined;
	try {
		return await renderWithProviders(ui);
	} finally {
		console.error = original;
	}
}

describe("Attachment", () => {
	describe("accessible name and role", () => {
		test("a file with no handler is text named by kind, name, size and state", async () => {
			await renderWithProviders(<Attachment kind="file" name="report.pdf" sizeBytes={2_516_582} />);
			expect(screen.getByLabelText("File, report.pdf, 2.4 megabytes")).toBeOnTheScreen();
		});

		test("an image with no handler is an image", async () => {
			await renderWithProviders(
				<Attachment kind="image" name="vacation.jpg" source={{ uri: "https://x.test/a.jpg" }} />
			);
			expect(screen.getByRole("image", { name: "Photo, vacation.jpg" })).toBeOnTheScreen();
		});

		test("a handler makes it a button, disabled included", async () => {
			await renderWithProviders(<Attachment isDisabled kind="file" name="report.pdf" onPress={jest.fn()} />);
			expect(screen.getByRole("button", { name: "File, report.pdf" })).toBeOnTheScreen();
		});

		test("an explicit accessibilityLabel wins", async () => {
			await renderWithProviders(<Attachment accessibilityLabel="Contract" kind="file" name="report.pdf" />);
			expect(screen.getByLabelText("Contract")).toBeOnTheScreen();
		});

		test("the label carries the upload state", async () => {
			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" status={{ type: "idle" }} />);
			expect(screen.getByLabelText("File, a.pdf, not sent")).toBeOnTheScreen();

			await view.rerender(<Attachment kind="file" name="a.pdf" status={{ type: "uploading" }} />);
			expect(screen.getByLabelText("File, a.pdf, uploading")).toBeOnTheScreen();

			await view.rerender(<Attachment kind="file" name="a.pdf" status={{ message: "Too large", type: "error" }} />);
			expect(screen.getByLabelText("File, a.pdf, upload failed, Too large")).toBeOnTheScreen();
		});

		test("the default parts show the name and the size", async () => {
			await renderWithProviders(<Attachment kind="file" name="report.pdf" sizeBytes={2_516_582} />);
			expect(screen.getByText("report.pdf")).toBeOnTheScreen();
			expect(screen.getByText(/2\.4 MB/)).toBeOnTheScreen();
		});

		test("an error shows the app's message as the meta line", async () => {
			await renderWithProviders(
				<Attachment kind="file" name="a.pdf" status={{ message: "Too large", type: "error" }} />
			);
			expect(screen.getByText("Too large")).toBeOnTheScreen();
		});
	});

	describe("accessibility state", () => {
		test("uploading is busy and idle is not", async () => {
			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" status={{ type: "uploading" }} />);
			expect(screen.getByLabelText(/uploading/)).toBeBusy();

			await view.rerender(<Attachment kind="file" name="a.pdf" />);
			expect(screen.getByLabelText("File, a.pdf")).not.toBeBusy();
		});

		test("isDisabled is announced", async () => {
			await renderWithProviders(<Attachment isDisabled kind="file" name="a.pdf" />);
			expect(screen.getByLabelText("File, a.pdf")).toBeDisabled();
		});

		test("a determinate upload carries its progress in ten-percent steps as the value", async () => {
			const view = await renderWithProviders(
				<Attachment kind="file" name="a.pdf" status={{ progress: 0.42, type: "uploading" }} />
			);
			expect(screen.getByLabelText(/uploading/)).toHaveAccessibilityValue({ max: 100, min: 0, now: 40 });

			await view.rerender(<Attachment kind="file" name="a.pdf" status={{ progress: 0.58, type: "uploading" }} />);
			expect(screen.getByLabelText(/uploading/)).toHaveAccessibilityValue({ max: 100, min: 0, now: 60 });
		});

		test("an indeterminate upload has no value", async () => {
			await renderWithProviders(<Attachment kind="file" name="a.pdf" status={{ type: "uploading" }} />);
			expect(screen.getByLabelText(/uploading/)).not.toHaveAccessibilityValue({ now: 0 });
		});
	});

	describe("callbacks", () => {
		test("the activate action calls onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(<Attachment kind="file" name="a.pdf" onPress={onPress} />);
			await activate(screen.getByRole("button"), "activate");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("the longpress action calls onLongPress", async () => {
			const onLongPress = jest.fn();
			await renderWithProviders(<Attachment kind="file" name="a.pdf" onLongPress={onLongPress} />);
			await activate(screen.getByRole("button"), "longpress");
			expect(onLongPress).toHaveBeenCalledTimes(1);
		});

		test("a disabled attachment calls neither onPress nor onLongPress", async () => {
			const onPress = jest.fn();
			const onLongPress = jest.fn();
			await renderWithProviders(
				<Attachment isDisabled kind="file" name="a.pdf" onLongPress={onLongPress} onPress={onPress} />
			);
			const root = screen.getByRole("button");
			await activate(root, "activate");
			await activate(root, "longpress");
			expect(onPress).not.toHaveBeenCalled();
			expect(onLongPress).not.toHaveBeenCalled();
		});

		test("the remove action calls onRemove and is labelled with the name", async () => {
			const onRemove = jest.fn();
			await renderWithProviders(<Attachment kind="file" name="report.pdf" onRemove={onRemove} />);
			const root = screen.getByLabelText("File, report.pdf");
			expect(root.props.accessibilityActions).toEqual([{ label: "Remove report.pdf", name: "remove" }]);
			await activate(root, "remove");
			expect(onRemove).toHaveBeenCalledTimes(1);
		});

		test("while uploading the remove action reads as cancel", async () => {
			await renderWithProviders(
				<Attachment kind="file" name="report.pdf" onRemove={jest.fn()} status={{ type: "uploading" }} />
			);
			expect(screen.getByLabelText(/uploading/).props.accessibilityActions).toEqual([
				{ label: "Cancel upload", name: "remove" },
			]);
		});

		test("removeAccessibilityLabel names the remove action", async () => {
			await renderWithProviders(
				<Attachment kind="file" name="a.pdf" onRemove={jest.fn()} removeAccessibilityLabel="Drop it" />
			);
			expect(screen.getByLabelText("File, a.pdf").props.accessibilityActions).toEqual([
				{ label: "Drop it", name: "remove" },
			]);
		});

		test("the retry action exists only in error and calls onRetry", async () => {
			const onRetry = jest.fn();
			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" onRetry={onRetry} />);
			expect(screen.getByLabelText("File, a.pdf").props.accessibilityActions).toBeUndefined();

			await view.rerender(
				<Attachment kind="file" name="a.pdf" onRetry={onRetry} status={{ message: "Offline", type: "error" }} />
			);
			const root = screen.getByLabelText(/upload failed/);
			expect(root.props.accessibilityActions).toEqual([{ label: "Retry upload", name: "retry" }]);
			await activate(root, "retry");
			expect(onRetry).toHaveBeenCalledTimes(1);
		});

		test("a disabled attachment withdraws remove and retry", async () => {
			const onRemove = jest.fn();
			const onRetry = jest.fn();
			await renderWithProviders(
				<Attachment
					isDisabled
					kind="file"
					name="a.pdf"
					onRemove={onRemove}
					onRetry={onRetry}
					status={{ message: "Offline", type: "error" }}
				/>
			);
			const root = screen.getByLabelText(/upload failed/);
			expect(root.props.accessibilityActions).toBeUndefined();
			await activate(root, "remove");
			await activate(root, "retry");
			expect(onRemove).not.toHaveBeenCalled();
			expect(onRetry).not.toHaveBeenCalled();
		});

		test("a caller's accessibility actions are kept and onAccessibilityAction still hears every action", async () => {
			const onAccessibilityAction = jest.fn();
			const onRemove = jest.fn();
			await renderWithProviders(
				<Attachment
					accessibilityActions={[{ label: "Share", name: "share" }]}
					kind="file"
					name="a.pdf"
					onAccessibilityAction={onAccessibilityAction}
					onRemove={onRemove}
				/>
			);
			const root = screen.getByLabelText("File, a.pdf");
			expect(root.props.accessibilityActions).toEqual([
				{ label: "Share", name: "share" },
				{ label: "Remove a.pdf", name: "remove" },
			]);
			await activate(root, "share");
			await activate(root, "remove");
			expect(onAccessibilityAction).toHaveBeenCalledTimes(2);
			expect(onRemove).toHaveBeenCalledTimes(1);
		});
	});

	describe("default parts", () => {
		test("a remove control is composed in only when there is an onRemove", async () => {
			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" removeTestID="remove" />);
			expect(screen.queryByTestId("remove", { includeHiddenElements: true })).not.toBeOnTheScreen();

			await view.rerender(<Attachment kind="file" name="a.pdf" onRemove={jest.fn()} removeTestID="remove" />);
			expect(screen.getByTestId("remove", { includeHiddenElements: true })).toBeOnTheScreen();
		});

		test("a retry control is composed in only in error with an onRetry", async () => {
			const view = await renderWithProviders(
				<Attachment kind="file" name="a.pdf" onRetry={jest.fn()} retryTestID="retry" />
			);
			expect(screen.queryByTestId("retry", { includeHiddenElements: true })).not.toBeOnTheScreen();

			await view.rerender(
				<Attachment
					kind="file"
					name="a.pdf"
					onRetry={jest.fn()}
					retryTestID="retry"
					status={{ message: "Offline", type: "error" }}
				/>
			);
			expect(screen.getByTestId("retry", { includeHiddenElements: true })).toBeOnTheScreen();
		});

		test("the remove and retry controls are hidden from assistive technology", async () => {
			await renderWithProviders(
				<Attachment
					kind="file"
					name="a.pdf"
					onRemove={jest.fn()}
					onRetry={jest.fn()}
					removeTestID="remove"
					retryTestID="retry"
					status={{ message: "Offline", type: "error" }}
				/>
			);
			expect(screen.queryByTestId("remove")).not.toBeOnTheScreen();
			expect(screen.queryByTestId("retry")).not.toBeOnTheScreen();
		});

		test("the upload bar is drawn only while uploading, and hidden from assistive technology", async () => {
			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" />);
			expect(screen.queryByRole("progressbar", { includeHiddenElements: true })).not.toBeOnTheScreen();

			await view.rerender(<Attachment kind="file" name="a.pdf" status={{ progress: 0.4, type: "uploading" }} />);
			expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		});

		test("children replace the default parts entirely", async () => {
			await renderWithProviders(
				<Attachment kind="file" name="a.pdf" onRemove={jest.fn()} removeTestID="remove">
					<Text>custom</Text>
				</Attachment>
			);
			expect(screen.getByText("custom")).toBeOnTheScreen();
			expect(screen.queryByText("a.pdf")).not.toBeOnTheScreen();
			expect(screen.queryByTestId("remove", { includeHiddenElements: true })).not.toBeOnTheScreen();
		});

		test("useAttachment reads the enclosing attachment from custom children", async () => {
			function Probe() {
				const { kind, name, status } = useAttachment();
				return <Text>{`${kind}:${name}:${status.type}`}</Text>;
			}
			await renderWithProviders(
				<Attachment kind="audio" name="memo.m4a" status={{ type: "idle" }}>
					<Probe />
				</Attachment>
			);
			expect(screen.getByText("audio:memo.m4a:idle")).toBeOnTheScreen();
		});
	});

	describe("error announcement", () => {
		const platform = Platform.OS;
		let announce: ReturnType<typeof jest.spyOn>;

		beforeEach(() => {
			announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			announce.mockClear();
			Platform.OS = "ios";
		});

		afterEach(() => {
			Platform.OS = platform;
			announce.mockRestore();
		});

		test("entering error announces once; mounting in error announces nothing", async () => {
			const mounted = await renderWithProviders(
				<Attachment kind="file" name="a.pdf" status={{ message: "Offline", type: "error" }} />
			);
			expect(announce).not.toHaveBeenCalled();
			await mounted.unmount();

			const view = await renderWithProviders(<Attachment kind="file" name="a.pdf" status={{ type: "uploading" }} />);
			await view.rerender(<Attachment kind="file" name="a.pdf" status={{ message: "Offline", type: "error" }} />);
			expect(announce).toHaveBeenCalledTimes(1);
			expect(announce).toHaveBeenCalledWith("Upload failed, a.pdf, Offline");
		});

		test("an error is a polite live region", async () => {
			await renderWithProviders(<Attachment kind="file" name="a.pdf" status={{ message: "Offline", type: "error" }} />);
			expect(screen.getByLabelText(/upload failed/).props.accessibilityLiveRegion).toBe("polite");
		});
	});

	describe("compound parts", () => {
		test.each([
			["Preview", () => <Attachment.Preview />],
			["Content", () => <Attachment.Content />],
			["Name", () => <Attachment.Name />],
			["Meta", () => <Attachment.Meta />],
			["Progress", () => <Attachment.Progress />],
			["Remove", () => <Attachment.Remove />],
			["Retry", () => <Attachment.Retry />],
		])("Attachment.%s outside an Attachment throws", async (part, render) => {
			await expect(renderWithoutRoot(render())).rejects.toThrow(
				`Attachment.${part} must be rendered inside an <Attachment>.`
			);
		});

		test("useAttachment outside an Attachment throws", async () => {
			function Probe() {
				useAttachment();
				return null;
			}
			await expect(renderWithoutRoot(<Probe />)).rejects.toThrow(
				"useAttachment must be called inside an <Attachment>."
			);
		});

		test("parts compose inside custom children", async () => {
			await renderWithProviders(
				<Attachment kind="file" name="report.pdf" sizeBytes={1024}>
					<Attachment.Preview />
					<Attachment.Content>
						<Attachment.Name />
						<Attachment.Meta />
					</Attachment.Content>
				</Attachment>
			);
			expect(screen.getByText("report.pdf")).toBeOnTheScreen();
			expect(screen.getByText(/1 KB/)).toBeOnTheScreen();
		});
	});

	describe("group", () => {
		test("is a labelled list", async () => {
			await renderWithProviders(
				<Attachment.Group>
					<Attachment kind="file" name="a.pdf" />
				</Attachment.Group>
			);
			expect(screen.getByLabelText("Attachments").props.accessibilityRole).toBe("list");
		});

		test("accessibilityLabel renames the list", async () => {
			await renderWithProviders(
				<Attachment.Group accessibilityLabel="Files to send">
					<Attachment kind="file" name="a.pdf" />
				</Attachment.Group>
			);
			expect(screen.getByLabelText("Files to send").props.accessibilityRole).toBe("list");
		});

		test("each attachment hints its place, and a caller's own hint wins", async () => {
			await renderWithProviders(
				<Attachment.Group>
					<Attachment key="a" kind="file" name="a.pdf" />
					<Attachment key="b" kind="file" name="b.pdf" />
					<Attachment accessibilityHint="Custom" key="c" kind="file" name="c.pdf" />
				</Attachment.Group>
			);
			expect(screen.getByLabelText("File, a.pdf").props.accessibilityHint).toBe("1 of 3");
			expect(screen.getByLabelText("File, b.pdf").props.accessibilityHint).toBe("2 of 3");
			expect(screen.getByLabelText("File, c.pdf").props.accessibilityHint).toBe("Custom");
		});

		test("removing one renumbers the rest", async () => {
			const view = await renderWithProviders(
				<Attachment.Group>
					<Attachment key="a" kind="file" name="a.pdf" />
					<Attachment key="b" kind="file" name="b.pdf" />
				</Attachment.Group>
			);
			await view.rerender(
				<Attachment.Group>
					<Attachment key="b" kind="file" name="b.pdf" />
				</Attachment.Group>
			);
			expect(screen.getByLabelText("File, b.pdf").props.accessibilityHint).toBe("1 of 1");
		});

		test("children keep working inside a group", async () => {
			const onRemove = jest.fn();
			await renderWithProviders(
				<Attachment.Group layout="card" size="lg">
					<Attachment key="a" kind="file" name="a.pdf" onRemove={onRemove} />
				</Attachment.Group>
			);
			await activate(screen.getByLabelText("File, a.pdf"), "remove");
			expect(onRemove).toHaveBeenCalledTimes(1);
		});
	});
});
