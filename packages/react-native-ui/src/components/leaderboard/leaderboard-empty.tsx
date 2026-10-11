import type { ReactElement } from "react";
import { EmptyState } from "../empty-state";

export type LeaderboardEmptyProps = {
	text: string;
};

/**
 * What a board with no entries shows: one muted line, on `EmptyState` at its
 * smallest so it matches every other empty list in the app. A board is
 * usually one section of a screen, so there is no picture and no action —
 * the caller who has one composes their own `EmptyState` instead.
 */
export function LeaderboardEmpty({ text }: LeaderboardEmptyProps): ReactElement {
	return (
		<EmptyState size="sm">
			<EmptyState.Header>
				<EmptyState.Description>{text}</EmptyState.Description>
			</EmptyState.Header>
		</EmptyState>
	);
}
LeaderboardEmpty.displayName = "DelacourUI.Leaderboard.Empty";
