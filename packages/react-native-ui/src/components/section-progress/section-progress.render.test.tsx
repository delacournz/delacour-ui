import { describe, expect, jest, test } from "@jest/globals";
import { type ComponentRef, type ReactElement, type RefObject, useRef } from "react";
import { AccessibilityInfo } from "react-native";
import type Animated from "react-native-reanimated";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { SectionProgress, type SectionProgressProps } from "./section-progress";
import { useSectionProgress } from "./section-progress.context";
import { SectionProgressItem } from "./section-progress-item";

// Not testable under Jest: the ring fill (Skia is stubbed), the label slide/resize, the panel grow
// and the reveal latch (all UI-thread worklets), the real screen-reader focus (the spy below only sees the
// target) and the Android back handler's real hardware path. Items stay mounted while closed, hidden from assistive
// technology, so item queries pass `includeHiddenElements`.

type Props = Partial<Omit<SectionProgressProps, "children">>;

function Pill(props: Props): ReactElement {
	return (
		<SectionProgress {...props}>
			<SectionProgress.Item value="intro">Introduction</SectionProgress.Item>
			<SectionProgress.Item value="pricing" color="success">
				Pricing
			</SectionProgress.Item>
			<SectionProgress.Item value="faq">FAQ</SectionProgress.Item>
		</SectionProgress>
	);
}

const hidden = { includeHiddenElements: true } as const;
const pill = () => screen.getByRole("button", { name: "Sections" });
const item = (name: string) => screen.getByRole("button", { name, ...hidden });
const activate = (element: ReturnType<typeof item>) => fireEvent(element, "accessibilityTap");

describe("SectionProgress", () => {
	test("renders the pill as a collapsed button named Sections", async () => {
		await renderWithProviders(<Pill defaultValue="intro" />);
		expect(pill()).toBeOnTheScreen();
		expect(pill()).toBeCollapsed();
	});

	test("the pill's value announces the active section and percent", async () => {
		await renderWithProviders(<Pill defaultValue="pricing" />);
		expect(pill()).toHaveAccessibilityValue({ text: "Pricing, 0 percent" });
	});

	test("accessibilityLabel renames the pill", async () => {
		await renderWithProviders(<Pill accessibilityLabel="Chapters" defaultValue="intro" />);
		expect(screen.getByRole("button", { name: "Chapters" })).toBeOnTheScreen();
	});

	test("the pill shows the active section's title beside the listed one", async () => {
		await renderWithProviders(<Pill defaultValue="faq" />);
		expect(screen.getAllByText("FAQ", hidden)).toHaveLength(2);
		expect(screen.getAllByText("Pricing", hidden)).toHaveLength(1);
	});

	test("the pill toggles the panel and reports onOpenChange", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Pill defaultValue="intro" onOpenChange={onOpenChange} />);

		await activate(pill());
		expect(pill()).toBeExpanded();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await activate(pill());
		expect(pill()).toBeCollapsed();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("defaultOpen starts the panel open", async () => {
		await renderWithProviders(<Pill defaultOpen defaultValue="intro" />);
		expect(pill()).toBeExpanded();
	});

	test("controlled isOpen waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Pill isOpen={false} onOpenChange={onOpenChange} />);

		await activate(pill());
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(pill()).toBeCollapsed();

		await rerender(<Pill isOpen onOpenChange={onOpenChange} />);
		expect(pill()).toBeExpanded();
	});

	test("every item is listed, and the active one is selected", async () => {
		await renderWithProviders(<Pill defaultOpen defaultValue="pricing" />);
		expect(item("Introduction")).not.toBeSelected();
		expect(item("Pricing")).toBeSelected();
		expect(item("FAQ")).not.toBeSelected();
	});

	test("with no active section no item is selected", async () => {
		await renderWithProviders(<Pill defaultOpen />);
		expect(item("Introduction")).not.toBeSelected();
		expect(item("Pricing")).not.toBeSelected();
	});

	test("picking an item emits it, selects it and closes the panel (uncontrolled)", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Pill defaultOpen defaultValue="intro" onOpenChange={onOpenChange} onValueChange={onValueChange} />
		);

		await activate(item("FAQ"));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("faq");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(pill()).toBeCollapsed();
		expect(item("FAQ")).toBeSelected();
		expect(item("Introduction")).not.toBeSelected();
	});

	test("controlled value reports the pick and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(<Pill defaultOpen onValueChange={onValueChange} value="intro" />);

		await activate(item("Pricing"));
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(item("Introduction")).toBeSelected();
		expect(item("Pricing")).not.toBeSelected();

		await rerender(<Pill defaultOpen onValueChange={onValueChange} value="pricing" />);
		expect(item("Pricing")).toBeSelected();
	});

	test("a controlled value of undefined stays controlled and means none yet", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(
			<Pill defaultOpen onValueChange={onValueChange} value={undefined} />
		);

		await activate(item("Pricing"));
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(item("Pricing")).not.toBeSelected();

		await rerender(<Pill defaultOpen onValueChange={onValueChange} value="pricing" />);
		expect(item("Pricing")).toBeSelected();
	});

	test("an item's own onPress also fires", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<SectionProgress defaultOpen defaultValue="a">
				<SectionProgress.Item onPress={onPress} value="a">
					Alpha
				</SectionProgress.Item>
			</SectionProgress>
		);
		await activate(item("Alpha"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled item neither emits nor closes the panel", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<SectionProgress defaultOpen defaultValue="a" onValueChange={onValueChange}>
				<SectionProgress.Item value="a">Alpha</SectionProgress.Item>
				<SectionProgress.Item disabled value="b">
					Beta
				</SectionProgress.Item>
			</SectionProgress>
		);
		expect(item("Beta")).toBeDisabled();
		await activate(item("Beta"));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(pill()).toBeExpanded();
	});

	test("tracks a changing controlled value on the pill", async () => {
		const { rerender } = await renderWithProviders(<Pill value="intro" />);
		await rerender(<Pill value="pricing" />);
		expect(pill()).toHaveAccessibilityValue({ text: "Pricing, 0 percent" });
	});

	test("an item outside a SectionProgress throws its documented error", async () => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(<SectionProgressItem value="x">X</SectionProgressItem>)).rejects.toThrow(
				"SectionProgress.Item must be rendered inside a <SectionProgress>."
			);
		} finally {
			console.error = original;
		}
	});

	describe("modal accessibility", () => {
		type HostView = ComponentRef<typeof Animated.View>;
		type Probe = {
			pill?: RefObject<HostView | null>;
			intro?: RefObject<HostView | null>;
			faq?: RefObject<HostView | null>;
		};

		function PillRef({ probe }: { probe: Probe }): null {
			probe.pill = useSectionProgress().pillRef;
			return null;
		}

		function Focusable({ probe, ...props }: Props & { probe: Probe }): ReactElement {
			const intro = useRef<HostView>(null);
			const faq = useRef<HostView>(null);
			probe.intro = intro;
			probe.faq = faq;
			return (
				<SectionProgress {...props}>
					<PillRef probe={probe} />
					<SectionProgress.Item ref={intro} value="intro">
						Introduction
					</SectionProgress.Item>
					<SectionProgress.Item value="pricing">Pricing</SectionProgress.Item>
					<SectionProgress.Item ref={faq} value="faq">
						FAQ
					</SectionProgress.Item>
				</SectionProgress>
			);
		}

		function focusSpy(probe: Probe): () => string[] {
			const parts: string[] = [];
			jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation((target, event) => {
				if (event !== "focus") return;
				const part = (["pill", "intro", "faq"] as const).find((key) => {
					const node = probe[key]?.current;
					return node !== null && node !== undefined && node === target;
				});
				if (part !== undefined) parts.push(part);
			});
			return () => [...parts];
		}

		/** The panel — the nearest ancestor of the pill that carries the modal prop. */
		function panel() {
			let node = pill().parent;
			while (node !== null && node.props.accessibilityViewIsModal === undefined) node = node.parent;
			if (node === null) throw new Error("no modal container above the pill");
			return node;
		}

		test("the panel is modal only while open", async () => {
			await renderWithProviders(<Pill defaultValue="intro" />);
			expect(panel().props.accessibilityViewIsModal).toBe(false);
			expect(panel().props.onAccessibilityEscape).toBeUndefined();
			await activate(pill());
			expect(panel().props.accessibilityViewIsModal).toBe(true);
		});

		test("the escape gesture closes the panel", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Pill defaultOpen defaultValue="intro" onOpenChange={onOpenChange} />);
			await act(() => panel().props.onAccessibilityEscape());
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(pill()).toBeCollapsed();
		});

		test("opening moves focus to the active item", async () => {
			const probe: Probe = {};
			const focused = focusSpy(probe);
			await renderWithProviders(<Focusable defaultValue="faq" probe={probe} />);
			await activate(pill());
			await waitFor(() => expect(focused()).toEqual(["faq"]));
		});

		test("with no active section focus falls back to the first item", async () => {
			const probe: Probe = {};
			const focused = focusSpy(probe);
			await renderWithProviders(<Focusable defaultOpen probe={probe} />);
			await waitFor(() => expect(focused()).toEqual(["intro"]));
		});

		test("closing returns focus to the pill, and mounting closed does not", async () => {
			const probe: Probe = {};
			const focused = focusSpy(probe);
			await renderWithProviders(<Focusable defaultValue="intro" probe={probe} />);
			expect(focused()).toEqual([]);
			await activate(pill());
			await waitFor(() => expect(focused()).toEqual(["intro"]));
			await activate(item("FAQ"));
			await waitFor(() => expect(focused()).toEqual(["intro", "pill"]));
		});
	});
});
