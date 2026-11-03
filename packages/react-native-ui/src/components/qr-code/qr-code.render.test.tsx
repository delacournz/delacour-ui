import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { QRCode } from "./qr-code";
import { warnQrOnce } from "./qr-code.warn";

jest.mock("./qr-code.warn", () => ({ warnQrOnce: jest.fn() }));

describe("QRCode", () => {
	const warn = jest.mocked(warnQrOnce);

	beforeEach(() => {
		warn.mockClear();
	});

	test("is an image named after its value", async () => {
		await renderWithProviders(<QRCode value="https://delacour.co.nz" />);
		expect(screen.getByRole("image", { name: "QR code: https://delacour.co.nz" })).toBeOnTheScreen();
	});

	test("a caller label replaces the default", async () => {
		await renderWithProviders(<QRCode accessibilityLabel="Open the docs" value="https://delacour.co.nz" />);
		expect(screen.getByRole("image", { name: "Open the docs" })).toBeOnTheScreen();
		expect(screen.queryByLabelText(/^QR code: /)).not.toBeOnTheScreen();
	});

	test("a long value is cut in the default label", async () => {
		const value = "a".repeat(200);
		await renderWithProviders(<QRCode value={value} />);
		const label = screen.getByRole("image").props.accessibilityLabel as string;
		expect(label.endsWith("…")).toBe(true);
		expect(label.length).toBeLessThan(value.length);
	});

	test("isDecorative removes it from the accessibility tree", async () => {
		await renderWithProviders(<QRCode isDecorative testID="qr" value="12345" />);
		expect(screen.queryByRole("image")).not.toBeOnTheScreen();
		expect(screen.getByTestId("qr", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("an empty value reports the error and reads as unavailable", async () => {
		const onEncodeError = jest.fn();
		await renderWithProviders(<QRCode onEncodeError={onEncodeError} value="" />);
		expect(onEncodeError).toHaveBeenCalledTimes(1);
		expect(onEncodeError).toHaveBeenCalledWith({ kind: "empty" });
		expect(screen.getByRole("image", { name: "QR code unavailable" })).toBeOnTheScreen();
	});

	test("a value too long for any version reports too-long", async () => {
		const onEncodeError = jest.fn();
		await renderWithProviders(<QRCode errorCorrection="H" onEncodeError={onEncodeError} value={"x".repeat(5000)} />);
		expect(onEncodeError).toHaveBeenCalledTimes(1);
		expect(onEncodeError).toHaveBeenCalledWith(expect.objectContaining({ kind: "too-long" }));
		expect(screen.getByRole("image", { name: "QR code unavailable" })).toBeOnTheScreen();
	});

	test("onEncodeError does not fire for a value that encodes", async () => {
		const onEncodeError = jest.fn();
		await renderWithProviders(<QRCode onEncodeError={onEncodeError} value="HELLO" />);
		expect(onEncodeError).not.toHaveBeenCalled();
	});

	test("an invalid option is reported", async () => {
		const onEncodeError = jest.fn();
		await renderWithProviders(<QRCode mask={9 as never} onEncodeError={onEncodeError} value="HELLO" />);
		expect(onEncodeError).toHaveBeenCalledWith(expect.objectContaining({ kind: "invalid-option", option: "mask" }));
	});

	test("a value with no label warns in development", async () => {
		await renderWithProviders(<QRCode value="warn-me-no-label" />);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessibilityLabel"));
	});

	test("a label silences the missing-label warning", async () => {
		await renderWithProviders(<QRCode accessibilityLabel="Join" value="silent-with-label" />);
		expect(warn).not.toHaveBeenCalled();
	});

	test("Logo renders inside the code, hidden from assistive tech", async () => {
		await renderWithProviders(
			<QRCode accessibilityLabel="Join" value="https://delacour.co.nz">
				<QRCode.Logo>
					<Text>Mark</Text>
				</QRCode.Logo>
			</QRCode>
		);
		expect(screen.getByText("Mark", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("Mark")).not.toBeOnTheScreen();
		expect(screen.getByRole("image", { name: "Join" })).toBeOnTheScreen();
	});

	test("a logo raises a lower explicit level and warns", async () => {
		await renderWithProviders(
			<QRCode accessibilityLabel="Join" errorCorrection="L" value="https://delacour.co.nz/raise">
				<QRCode.Logo>
					<Text>Mark</Text>
				</QRCode.Logo>
			</QRCode>
		);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('raised to "H"'));
	});

	test("Logo outside a QRCode throws its documented error", async () => {
		const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(
				renderWithProviders(
					<QRCode.Logo>
						<Text>Mark</Text>
					</QRCode.Logo>
				)
			).rejects.toThrow("QRCode.Logo must be rendered inside a <QRCode>.");
		} finally {
			error.mockRestore();
		}
	});
});
