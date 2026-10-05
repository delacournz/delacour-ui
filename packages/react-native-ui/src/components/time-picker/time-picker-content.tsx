import type { ReactElement, ReactNode } from "react";
import { BottomSheet } from "../bottom-sheet";
import { useTimePickerPart } from "./time-picker.context";
import { timePickerVariants } from "./time-picker.variants";
import { TimePickerClear } from "./time-picker-clear";
import { TimePickerDone } from "./time-picker-done";
import { TimePickerWheelSlot } from "./time-picker-wheel-slot";

export type TimePickerContentProps = {
	/** The sheet's heading. Defaults to the root's `title`. */
	title?: string;
	/** The body. Omit for the wheel. */
	children?: ReactNode;
	/** The footer's controls. Omit for Done, with Clear before it when the root is `clearable`. */
	footer?: ReactNode;
	className?: string;
};

/**
 * The sheet the wheel lives in: portal, scrim, panel, a title, the body and a
 * footer — the whole `BottomSheet` composition, so a caller writes one part.
 *
 * The title is a `BottomSheet.Title`, so the engine labels the modal panel
 * with it and focus entering the sheet announces it first. The footer is a
 * pinned `BottomSheet.Footer`, which brings its own gutter, surface, hairline
 * and the safe-area band under it — the body's gutter is not doubled.
 *
 * The sheet itself is mounted by the root, which also turns the content pan
 * off — every vertical drag inside belongs to a wheel, and the handle still
 * drags the sheet.
 *
 * @example
 * <TimePicker.Content title="Reminder time">
 *   <TimePicker.Wheel />
 * </TimePicker.Content>
 */
export function TimePickerContent({ title, children, footer, className }: TimePickerContentProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Content");
	const slots = timePickerVariants();

	return (
		<BottomSheet.Portal>
			<BottomSheet.Overlay />
			<BottomSheet.Container>
				<BottomSheet.Content className={className}>
					<BottomSheet.Title className={slots.header()}>{title ?? picker.title}</BottomSheet.Title>
					{children ?? <TimePickerWheelSlot />}
				</BottomSheet.Content>
				<BottomSheet.Footer className={slots.footer()} sticky>
					{footer ?? (
						<>
							{picker.clearable ? <TimePickerClear /> : null}
							<TimePickerDone />
						</>
					)}
				</BottomSheet.Footer>
			</BottomSheet.Container>
		</BottomSheet.Portal>
	);
}
TimePickerContent.displayName = "DelacourUI.TimePicker.Content";
