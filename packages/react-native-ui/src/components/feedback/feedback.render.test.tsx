import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Feedback, type FeedbackProps } from "./feedback";
import { useFeedback } from "./feedback.context";
import type { FeedbackSubmitProps } from "./feedback-submit";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

type Harness = Omit<FeedbackProps, "children"> & {
	onSubmit?: FeedbackSubmitProps["onSubmit"];
	canSubmitEmpty?: boolean;
};

function Harness({ onSubmit = () => undefined, canSubmitEmpty, ...props }: Harness): ReactElement {
	return (
		<Feedback {...props}>
			<Feedback.Trigger asChild>
				<Button>Give feedback</Button>
			</Feedback.Trigger>
			<Feedback.Content>
				<Feedback.Panel>
					<Feedback.Title>What should we fix first?</Feedback.Title>
					<Feedback.Close />
					<Feedback.Field placeholder="Tell us" />
				</Feedback.Panel>
				<Feedback.Footer>
					<Feedback.Action>Skip</Feedback.Action>
					<Feedback.Cancel />
					<Feedback.Submit canSubmitEmpty={canSubmitEmpty} onSubmit={onSubmit} />
				</Feedback.Footer>
			</Feedback.Content>
		</Feedback>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
const field = () => screen.getByPlaceholderText("Tell us");

describe("Feedback", () => {
	test("renders nothing but the trigger until opened", async () => {
		await renderWithProviders(<Harness />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Give feedback" })).toBeOnTheScreen();
		expect(screen.queryByRole("header", { name: "What should we fix first?" })).not.toBeOnTheScreen();
	});

	test("the trigger opens it, and the title is the field's default label", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Harness onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Give feedback");
		expect(screen.getByRole("header", { name: "What should we fix first?" })).toBeOnTheScreen();
		expect(field()).toBeOnTheScreen();
		expect(field().props.accessibilityLabel).toBe("What should we fix first?");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
	});

	test("Close and Cancel each shut it and report false", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Harness defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Close");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await screen.findByRole("button", { name: "Give feedback" });
		await press("Give feedback");
		await press("Cancel");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(onOpenChange).toHaveBeenCalledTimes(3);
	});

	test("a custom Action is a button that calls its own onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Feedback defaultOpen>
				<Feedback.Content>
					<Feedback.Footer>
						<Feedback.Action onPress={onPress}>Skip</Feedback.Action>
					</Feedback.Footer>
				</Feedback.Content>
			</Feedback>,
			{ wrapper: Overlays }
		);
		await press("Skip");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("controlled isOpen: the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Harness isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Give feedback");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("header", { name: "What should we fix first?" })).not.toBeOnTheScreen();
	});

	test("uncontrolled draft: defaultValue seeds it and typing updates it", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Harness defaultOpen defaultValue="Hi" onValueChange={onValueChange} />, {
			wrapper: Overlays,
		});
		expect(field()).toHaveDisplayValue("Hi");
		await fireEvent.changeText(field(), "Hello");
		expect(onValueChange).toHaveBeenLastCalledWith("Hello");
		expect(field()).toHaveDisplayValue("Hello");
	});

	test("controlled draft reports and waits for the rerender", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(<Harness defaultOpen onValueChange={onValueChange} value="a" />, {
			wrapper: Overlays,
		});
		await fireEvent.changeText(field(), "ab");
		expect(onValueChange).toHaveBeenLastCalledWith("ab");
		expect(field()).toHaveDisplayValue("a");
		await rerender(<Harness defaultOpen onValueChange={onValueChange} value="ab" />);
		expect(field()).toHaveDisplayValue("ab");
	});

	test("the field is a multiline text input that Field's own accessibilityLabel can override", async () => {
		await renderWithProviders(
			<Feedback defaultOpen>
				<Feedback.Content>
					<Feedback.Panel>
						<Feedback.Title>Question</Feedback.Title>
						<Feedback.Field accessibilityLabel="Your message" />
					</Feedback.Panel>
				</Feedback.Content>
			</Feedback>,
			{ wrapper: Overlays }
		);
		expect(screen.getByLabelText("Your message")).toBeOnTheScreen();
	});

	test("Submit is disabled for an empty or whitespace draft and does not fire", async () => {
		const onSubmit = jest.fn<(value: string) => void>();
		await renderWithProviders(<Harness defaultOpen defaultValue="   " onSubmit={onSubmit} />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
		await press("Send");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test("canSubmitEmpty lets an empty draft through", async () => {
		const onSubmit = jest.fn<(value: string) => void>();
		await renderWithProviders(<Harness canSubmitEmpty defaultOpen onSubmit={onSubmit} />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
		await press("Send");
		expect(onSubmit).toHaveBeenCalledWith("");
	});

	test("Submit sends the trimmed draft and never closes", async () => {
		const onSubmit = jest.fn<(value: string) => void>();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Harness defaultOpen defaultValue="  great app  " onOpenChange={onOpenChange} onSubmit={onSubmit} />,
			{ wrapper: Overlays }
		);
		await press("Send");
		expect(onSubmit).toHaveBeenCalledWith("great app");
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(field()).toBeOnTheScreen();
	});

	test("an async send is busy and read-only until it settles, then the draft is intact", async () => {
		let finish: () => void = () => undefined;
		const onSubmit = jest.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				})
		);
		await renderWithProviders(<Harness defaultOpen defaultValue="hello" onSubmit={onSubmit} />, { wrapper: Overlays });
		await press("Send");
		expect(screen.getByRole("button", { name: "Send" })).toBeBusy();
		expect(field()).toBeDisabled();

		await press("Send");
		expect(onSubmit).toHaveBeenCalledTimes(1);

		finish();
		await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).not.toBeBusy());
		expect(field()).toHaveDisplayValue("hello");
		expect(field()).not.toBeDisabled();
	});

	test("useFeedback().clear() empties the draft", async () => {
		function ClearButton(): ReactElement {
			const { clear } = useFeedback();
			return <Button onPress={clear}>Reset</Button>;
		}
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Feedback defaultOpen defaultValue="draft" onValueChange={onValueChange}>
				<Feedback.Content>
					<Feedback.Panel>
						<Feedback.Title>What should we fix first?</Feedback.Title>
						<Feedback.Field placeholder="Tell us" />
					</Feedback.Panel>
					<Feedback.Footer>
						<ClearButton />
					</Feedback.Footer>
				</Feedback.Content>
			</Feedback>,
			{ wrapper: Overlays }
		);
		await press("Reset");
		expect(onValueChange).toHaveBeenLastCalledWith("");
		expect(field()).toHaveDisplayValue("");
	});

	test("an uncontrolled draft survives a close and a reopen", async () => {
		await renderWithProviders(<Harness defaultOpen defaultValue="keep me" />, { wrapper: Overlays });
		await press("Cancel");
		await screen.findByRole("button", { name: "Give feedback" });
		await press("Give feedback");
		expect(field()).toHaveDisplayValue("keep me");
	});

	describe("outside a Feedback", () => {
		const silenced = async (ui: ReactElement, message: RegExp) => {
			const original = console.error;
			console.error = () => undefined;
			try {
				await expect(renderWithProviders(ui, { wrapper: Overlays })).rejects.toThrow(message);
			} finally {
				console.error = original;
			}
		};

		test("Field throws", async () => {
			await silenced(<Feedback.Field />, /Feedback\.Field must be rendered inside a <Feedback>/);
		});

		test("Submit throws", async () => {
			await silenced(
				<Feedback.Submit onSubmit={() => undefined} />,
				/Feedback\.Submit must be rendered inside a <Feedback>/
			);
		});

		test("Cancel throws", async () => {
			await silenced(<Feedback.Cancel />, /Feedback\.Cancel must be rendered inside a <Feedback>/);
		});

		test("Title throws", async () => {
			await silenced(<Feedback.Title>Q</Feedback.Title>, /Feedback\.Title must be rendered inside a <Feedback>/);
		});

		test("useFeedback throws", async () => {
			function Probe(): null {
				useFeedback();
				return null;
			}
			await silenced(<Probe />, /useFeedback must be called inside a <Feedback>/);
		});
	});

	describe("result announcement", () => {
		const originalOS = Platform.OS;
		let withOptions: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;
		let plain: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;

		beforeEach(() => {
			resetAnnouncer();
			Object.defineProperty(Platform, "OS", { configurable: true, get: () => "ios" });
			plain = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
			withOptions = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => {});
			plain.mockClear();
			withOptions.mockClear();
		});

		afterEach(() => {
			Object.defineProperty(Platform, "OS", { configurable: true, get: () => originalOS });
			jest.restoreAllMocks();
		});

		test("a resolved send is announced polite, once", async () => {
			await renderWithProviders(<Harness defaultOpen defaultValue="hi" onSubmit={async () => undefined} />, {
				wrapper: Overlays,
			});
			await press("Send");
			await waitFor(() => expect(withOptions).toHaveBeenCalledTimes(1));
			expect(withOptions).toHaveBeenCalledWith("Feedback sent", { queue: true });
		});

		test("a synchronous send announces nothing", async () => {
			await renderWithProviders(<Harness defaultOpen defaultValue="hi" onSubmit={() => undefined} />, {
				wrapper: Overlays,
			});
			await press("Send");
			expect(withOptions).not.toHaveBeenCalled();
		});
	});
});
