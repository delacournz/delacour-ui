import { type ReactElement, type ReactNode, useState } from "react";
import { BottomSheet } from "../bottom-sheet";
import { usePlannerPart } from "./planner.context";
import type { PlannerEntry } from "./planner.types";
import { formatDayTitle, toDayKey } from "./planner-dates";

type DayContent = ReactNode | ((date: Date, entries: readonly PlannerEntry[]) => ReactNode);

export type PlannerDetailsProps = {
	/** The sheet's body for the selected day. */
	children: (date: Date, entries: readonly PlannerEntry[]) => ReactNode;
	/** The sheet's heading. Defaults to the day — "Wednesday, 14 October". */
	title?: DayContent;
	/** A line under the heading. */
	description?: DayContent;
};

const NO_ENTRIES: readonly PlannerEntry[] = [];

/**
 * A bottom sheet of the selected day's entries.
 *
 * Open while a day is selected, and closing it — the close button, a swipe
 * down, the scrim — clears the selection, so the sheet and the selection are
 * one state rather than two that can disagree. Leave it out and pressing a day
 * opens nothing; `onDayPress` still fires, which is the way to push a screen
 * instead.
 *
 * The sheet keeps drawing the last day it showed while it closes, so its
 * contents do not empty out from under the closing animation.
 *
 * A `BottomSheet`, so the app mounts `BottomSheetProvider` once, as it would
 * for any sheet.
 */
export function PlannerDetails({ children, title, description }: PlannerDetailsProps): ReactElement {
	const { selected, select, entriesByDay, locale } = usePlannerPart("Planner.Details");
	const [shown, setShown] = useState<Date | null>(selected);
	if (selected !== null && (shown === null || toDayKey(shown) !== toDayKey(selected))) {
		setShown(selected);
	}

	const entries = shown === null ? NO_ENTRIES : (entriesByDay.get(toDayKey(shown)) ?? NO_ENTRIES);
	const resolve = (content: DayContent, date: Date): ReactNode =>
		typeof content === "function" ? content(date, entries) : content;

	return (
		<BottomSheet
			isOpen={selected !== null}
			onOpenChange={(isOpen) => {
				if (!isOpen) select(null);
			}}
		>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Close />
						{shown === null ? null : (
							<>
								<BottomSheet.Title>
									{title === undefined ? formatDayTitle(shown, locale) : resolve(title, shown)}
								</BottomSheet.Title>
								{description === undefined ? null : (
									<BottomSheet.Description>{resolve(description, shown)}</BottomSheet.Description>
								)}
								{children(shown, entries)}
							</>
						)}
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
PlannerDetails.displayName = "DelacourUI.Planner.Details";
